const axios = require("axios");
const { isPlaceholderValue } = require("../utils/config");

function detectAIService() {
  const apiKey = process.env.AI_API_KEY;
  const serviceUrl = process.env.AI_SERVICE_URL;

  if (!apiKey || isPlaceholderValue(apiKey)) {
    return null;
  }

  // Detect Claude/Anthropic
  if (serviceUrl?.includes('anthropic.com') || apiKey.startsWith('sk-ant-')) {
    return 'claude';
  }

  // Detect OpenAI
  if (serviceUrl?.includes('openai.com') || apiKey.startsWith('sk-')) {
    return 'openai';
  }

  // Default to OpenAI format
  return 'openai';
}

function buildRemoteClient() {
  const service = detectAIService();
  if (!service) {
    return null;
  }

  const baseURL = process.env.AI_SERVICE_URL || "https://api.openai.com/v1";

  if (service === 'claude') {
    return axios.create({
      baseURL: baseURL || "https://api.anthropic.com/v1",
      headers: {
        "x-api-key": process.env.AI_API_KEY,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
      },
      timeout: 30000
    });
  }

  // OpenAI format
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    timeout: 15000
  });
}

async function requestJson(systemPrompt, userPrompt) {
  const client = buildRemoteClient();
  const service = detectAIService();

  if (!client || !service) {
    return null;
  }

  try {
    if (service === 'claude') {
      const response = await client.post("/messages", {
        model: process.env.AI_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      });

      const content = response.data?.content?.[0]?.text;
      return content ? JSON.parse(content) : null;
    } else {
      // OpenAI format
      const response = await client.post("/chat/completions", {
        model: process.env.AI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const content = response.data?.choices?.[0]?.message?.content;
      return content ? JSON.parse(content) : null;
    }
  } catch (error) {
    console.warn("Remote AI request failed, falling back to deterministic generator.", error.message);
    return null;
  }
}

async function requestText(systemPrompt, userPrompt, options = {}) {
  const client = buildRemoteClient();
  const service = detectAIService();

  if (!client || !service) {
    return null;
  }

  try {
    if (service === 'claude') {
      const response = await client.post("/messages", {
        model: options.model || process.env.AI_MODEL || "claude-3-sonnet-20240229",
        max_tokens: options.maxTokens || 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
        temperature: options.temperature || 0.7
      });

      return response.data?.content?.[0]?.text || null;
    } else {
      // OpenAI format
      const response = await client.post("/chat/completions", {
        model: options.model || process.env.AI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048
      });

      return response.data?.choices?.[0]?.message?.content || null;
    }
  } catch (error) {
    console.warn("AI text generation failed:", error.message);
    return null;
  }
}

async function generateImage(prompt, options = {}) {
  const service = detectAIService();

  if (service === 'openai' || !process.env.AI_SERVICE_URL?.includes('anthropic')) {
    // Use OpenAI DALL-E for image generation
    const client = axios.create({
      baseURL: "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    });

    try {
      const response = await client.post("/images/generations", {
        model: "dall-e-3",
        prompt: prompt,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        n: 1
      });

      return response.data?.data?.[0]?.url || null;
    } catch (error) {
      console.warn("Image generation failed:", error.message);
      return null;
    }
  }

  // For Claude, we'll use text-to-image via another service or fallback
  console.warn("Image generation not supported for Claude API yet");
  return null;
}

async function generateSocialContent(projectData, platform, tone = "professional") {
  const systemPrompt = `You are a social media content strategist specializing in portfolio case studies.
Create engaging ${platform} content that showcases project achievements and attracts potential clients.

Platform guidelines:
- LinkedIn: Professional, detailed, B2B focused
- Twitter/X: Concise, punchy, engaging
- Instagram: Visual, story-driven, emotive
- Behance: Creative, process-focused, visual

Always include:
- Hook/attention grabber
- Key challenge solved
- Main results/impact
- Call to action
- Relevant hashtags

Keep content authentic and results-focused.`;

  const userPrompt = `Generate ${platform} content for this project:

Project: ${projectData.title}
Client: ${projectData.client_name}
Challenge: ${projectData.challenge_text}
Solution: ${projectData.solution_text}
Results: ${projectData.results_text}
Deliverables: ${projectData.deliverables?.join(", ") || "Multiple deliverables"}
Tone: ${tone}

Create a compelling post that would convert viewers into leads.`;

  return await requestText(systemPrompt, userPrompt, {
    temperature: 0.8,
    maxTokens: 1000
  });
}

async function generateImagePrompt(projectData, style = "professional") {
  const systemPrompt = `You are a visual content strategist. Create detailed, professional image generation prompts for portfolio case studies.

Focus on:
- Clean, modern design aesthetics
- Professional color palettes
- Clear visual hierarchy
- Brand-appropriate styling
- High-quality, commercial feel

Style guidelines:
- Professional: Clean, corporate, trustworthy
- Creative: Bold, artistic, innovative
- Minimal: Simple, elegant, sophisticated
- Tech: Modern, digital, futuristic`;

  const userPrompt = `Create a detailed image generation prompt for this project:

Project: ${projectData.title}
Client: ${projectData.client_name}
Industry: ${projectData.industry || "Technology"}
Challenge: ${projectData.challenge_text?.substring(0, 100)}...
Solution: ${projectData.solution_text?.substring(0, 100)}...
Results: ${projectData.results_text?.substring(0, 100)}...
Style: ${style}

Generate a prompt that would create a stunning portfolio showcase image.`;

  return await requestText(systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: 500
  });
}

function parseList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

async function generatePortfolioDraft(project) {
  const remote = await requestJson(
    "Return JSON with hero_summary, challenge, solution, results, deliverables, proof_points, testimonial_prompt, status.",
    `Create a structured portfolio draft for this project:\n${JSON.stringify(project)}`
  );

  if (remote) {
    return remote;
  }

  return {
    hero_summary: `Case study: ${project.title} for ${project.client_name || "an upcoming client story"}`,
    challenge:
      project.challenge_text ||
      "Clarify the business problem, what was at stake, and why the work mattered.",
    solution:
      project.solution_text ||
      "Frame the process around the strongest decisions, differentiators, and execution steps.",
    results:
      project.results_text ||
      "Highlight outcomes, metrics, before / after movement, or proof-backed improvements.",
    deliverables: parseList(project.deliverables),
    proof_points: [
      project.results_text || "Add one measurable improvement or testimonial-backed shift.",
      "Use one visual proof point in the hero gallery.",
      "Keep the narrative centered on challenge, solution, and outcome."
    ],
    testimonial_prompt: "Add the strongest client quote or qualitative outcome here.",
    status: "generated"
  };
}

async function analyzeProjectFit(project, options = {}) {
  const remote = await requestJson(
    "Return JSON with linkedin, behance, dribbble objects. Each object should include score, reason, angle, format, cta.",
    `Analyze platform fit for this project:\n${JSON.stringify({
      project,
      options
    })}`
  );

  if (remote) {
    return remote;
  }

  const hasMetrics = Boolean(project.results_text);
  const deliverableCount = parseList(project.deliverables).length;
  const assetCount = Array.isArray(project.assets_url) ? project.assets_url.length : 0;

  return {
    linkedin: {
      score: hasMetrics ? 92 : 78,
      reason: hasMetrics
        ? "Strong business impact and measurable proof points."
        : "Good story potential, but it needs stronger outcome framing.",
      angle: "Business impact narrative",
      format: "Long-form post with carousel",
      cta: "Invite discovery calls or case-study views"
    },
    behance: {
      score: deliverableCount >= 3 ? 88 : 74,
      reason:
        deliverableCount >= 3
          ? "The project has enough process depth for a richer case study."
          : "Behance can work, but the process needs more structure.",
      angle: "Visual case study breakdown",
      format: "Multi-section project display",
      cta: "Drive to the full process narrative"
    },
    dribbble: {
      score: assetCount >= 3 ? 84 : 64,
      reason:
        assetCount >= 3
          ? "There are enough polished visuals for a teaser shot."
          : "Visual depth is limited, so Dribbble should stay secondary.",
      angle: "Highlight the cleanest hero view",
      format: "Shot teaser with short caption",
      cta: "Link back to the portfolio"
    }
  };
}

async function generateChannelDraft({ project, platform, tone, objective }) {
  const remote = await requestJson(
    "Return JSON with headline, body, cta, tags, why_this_works.",
    `Generate a ${platform} draft for this project:\n${JSON.stringify({
      project,
      tone,
      objective
    })}`
  );

  if (remote) {
    return remote;
  }

  const client = project.client_name || "the client";
  const resultLine =
    project.results_text || "a stronger narrative, cleaner proof, and a clearer market story";

  if (platform === "linkedin") {
    return {
      headline: `How we turned ${project.title} into a stronger growth story for ${client}`,
      body: `The challenge was not just shipping the work. It was turning the work into something decision-makers could understand fast.\n\nWe structured the story around the core challenge, the delivery logic, and the clearest proof point.\n\nResult: ${resultLine}.`,
      cta: objective === "Get clients"
        ? "If you want your next project to sell as clearly as it ships, let’s talk."
        : "Happy to share the framework behind this case study workflow.",
      tags: ["#PortfolioStrategy", "#CaseStudy", "#ClientWork", "#LinkedIn"],
      why_this_works: `${tone} tone with an outcome-led opening and a practical CTA.`
    };
  }

  if (platform === "dribbble") {
    return {
      headline: `${project.title} teaser`,
      body: `A polished snapshot from ${project.title}, built to hint at the system without needing the full story in-frame.`,
      cta: "Full process and outcomes live in the portfolio case study.",
      tags: ["design", "case study", "portfolio", "dribbble"],
      why_this_works: "Dribbble stays visual-first and routes deeper context back to the project page."
    };
  }

  return {
    headline: project.title,
    body: `A richer case study for ${client} that walks through the challenge, the solution path, the deliverables, and the outcome story.\n\nResults: ${resultLine}.`,
    cta: "Use this export pack to publish the project manually with the recommended asset order.",
    tags: ["Behance", "Case Study", "Process", "Portfolio"],
    why_this_works: "Behance copy stays process-rich and export-ready for V1."
  };
}

async function generateReviewReply(review, tone) {
  const remote = await requestJson(
    "Return JSON with draft.",
    `Write a ${tone} review response for:\n${JSON.stringify(review)}`
  );

  if (remote?.draft) {
    return remote.draft;
  }

  if (tone === "apologetic") {
    return `Thank you for the honest feedback, ${review.reviewer_name}. We are sorry the experience did not feel as strong as the final work. We are reviewing where communication or delivery clarity slipped and would welcome the chance to make that right.`;
  }

  if (tone === "premium") {
    return `Thank you for sharing this, ${review.reviewer_name}. We take every piece of feedback seriously and are committed to refining both the quality of the work and the quality of the client experience.`;
  }

  return `Thank you for the feedback, ${review.reviewer_name}. We appreciate the time you took to share your experience and will use it to keep improving how we deliver and communicate our work.`;
}

function classifySentiment({ rating, reviewText }) {
  const text = (reviewText || "").toLowerCase();

  if (rating <= 2 || text.includes("missed") || text.includes("late")) {
    return "negative";
  }

  if (rating === 3 || text.includes("could have")) {
    return "neutral";
  }

  return "positive";
}

module.exports = {
  analyzeProjectFit,
  classifySentiment,
  detectAIService,
  generateChannelDraft,
  generateImagePrompt,
  generatePortfolioDraft,
  generateReviewReply,
  generateSocialContent,
  requestText
};
