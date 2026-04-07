"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Image,
  Link,
  Loader2,
  Sparkles,
  Upload,
  Users,
  Zap
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { createProject } from "@/lib/api";

const steps = [
  {
    id: "basics",
    title: "Project Basics",
    description: "Tell us about your project",
    icon: FileText
  },
  {
    id: "details",
    title: "Project Details",
    description: "Add more context and details",
    icon: Users
  },
  {
    id: "assets",
    title: "Assets & Links",
    description: "Upload files and add links",
    icon: Image
  },
  {
    id: "review",
    title: "Review & Create",
    description: "Review your case study",
    icon: Check
  }
];

export default function NewProjectPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    category: "",
    industry: "",
    timeline: "",
    challenge_text: "",
    solution_text: "",
    results_text: "",
    deliverables: "",
    source_url: "",
    assets_url: ""
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const projectData = {
        ...formData,
        deliverables: formData.deliverables.split(",").map(d => d.trim()).filter(Boolean),
        assets_url: formData.assets_url.split(",").map(a => a.trim()).filter(Boolean)
      };

      const result = await createProject(token || "", projectData);
      router.push(`/dashboard/projects/${result.project.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Project Basics</h2>
              <p className="text-on-surface-variant">Let&apos;s start with the fundamentals of your case study</p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., E-commerce Platform Redesign"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  placeholder="e.g., TechCorp Inc."
                  value={formData.client_name}
                  onChange={(e) => updateFormData("client_name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Web Design"
                    value={formData.category}
                    onChange={(e) => updateFormData("category", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology"
                    value={formData.industry}
                    onChange={(e) => updateFormData("industry", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 3 months"
                  value={formData.timeline}
                  onChange={(e) => updateFormData("timeline", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Project Story</h2>
              <p className="text-on-surface-variant">Tell the story of your project&apos;s challenge, solution, and results</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="challenge_text">The Challenge</Label>
                <Textarea
                  id="challenge_text"
                  placeholder="What problem were you solving? What was at stake?"
                  rows={4}
                  value={formData.challenge_text}
                  onChange={(e) => updateFormData("challenge_text", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution_text">The Solution</Label>
                <Textarea
                  id="solution_text"
                  placeholder="How did you approach and solve the problem?"
                  rows={4}
                  value={formData.solution_text}
                  onChange={(e) => updateFormData("solution_text", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="results_text">The Results</Label>
                <Textarea
                  id="results_text"
                  placeholder="What outcomes did you achieve? Include metrics and impact."
                  rows={4}
                  value={formData.results_text}
                  onChange={(e) => updateFormData("results_text", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliverables">Key Deliverables</Label>
                <Textarea
                  id="deliverables"
                  placeholder="List the main deliverables (comma-separated)"
                  rows={3}
                  value={formData.deliverables}
                  onChange={(e) => updateFormData("deliverables", e.target.value)}
                />
                <p className="text-sm text-on-surface-variant">Separate multiple deliverables with commas</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Assets & Links</h2>
              <p className="text-on-surface-variant">Add supporting materials and references</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="source_url">Project URL</Label>
                <Input
                  id="source_url"
                  type="url"
                  placeholder="https://example.com/project"
                  value={formData.source_url}
                  onChange={(e) => updateFormData("source_url", e.target.value)}
                />
                <p className="text-sm text-on-surface-variant">Link to the live project or case study</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assets_url">Asset URLs</Label>
                <Textarea
                  id="assets_url"
                  placeholder="Add links to images, videos, or documents (one per line)"
                  rows={4}
                  value={formData.assets_url}
                  onChange={(e) => updateFormData("assets_url", e.target.value)}
                />
                <p className="text-sm text-on-surface-variant">One URL per line. These will be used to generate social media content.</p>
              </div>

              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Upload className="w-12 h-12 text-on-surface-variant mb-4" />
                  <p className="text-on-surface-variant text-center">
                    File upload coming soon. For now, add asset URLs above.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-on-surface mb-2">Review Your Case Study</h2>
              <p className="text-on-surface-variant">Make sure everything looks good before creating</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {formData.title || "Untitled Project"}
                </CardTitle>
                <CardDescription>
                  {formData.client_name && `Client: ${formData.client_name}`}
                  {formData.category && ` • ${formData.category}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.challenge_text && (
                  <div>
                    <h4 className="font-semibold mb-2">Challenge</h4>
                    <p className="text-sm text-on-surface-variant">{formData.challenge_text}</p>
                  </div>
                )}

                {formData.solution_text && (
                  <div>
                    <h4 className="font-semibold mb-2">Solution</h4>
                    <p className="text-sm text-on-surface-variant">{formData.solution_text}</p>
                  </div>
                )}

                {formData.results_text && (
                  <div>
                    <h4 className="font-semibold mb-2">Results</h4>
                    <p className="text-sm text-on-surface-variant">{formData.results_text}</p>
                  </div>
                )}

                {formData.deliverables && (
                  <div>
                    <h4 className="font-semibold mb-2">Deliverables</h4>
                    <p className="text-sm text-on-surface-variant">{formData.deliverables}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.trim() && formData.client_name.trim();
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/projects")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <div className="mb-6">
            <Progress value={progress} className="w-full h-2" />
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-surface-container text-on-surface-variant"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      isActive ? "text-primary font-semibold" : "text-on-surface-variant"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !canProceed()}
              className="min-w-32"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Case Study
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}