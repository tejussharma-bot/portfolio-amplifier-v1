const { pool } = require("./config");

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        full_name VARCHAR(255),
        account_type VARCHAR(50),
        professional_role VARCHAR(120),
        role VARCHAR(50),
        website VARCHAR(255),
        industry VARCHAR(120),
        services_offered TEXT,
        brand_voice VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        channels_used JSONB DEFAULT '[]'::jsonb,
        first_goal VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workspace_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        default_objective VARCHAR(100) DEFAULT 'Get clients',
        default_tone VARCHAR(50) DEFAULT 'Professional',
        default_review_tone VARCHAR(50) DEFAULT 'professional',
        timezone VARCHAR(100) DEFAULT 'Asia/Calcutta',
        publishing_defaults JSONB DEFAULT '{}'::jsonb,
        notification_preferences JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        client_name VARCHAR(255),
        category VARCHAR(100),
        industry VARCHAR(100),
        timeline VARCHAR(120),
        source_url TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        challenge_text TEXT,
        solution_text TEXT,
        results_text TEXT,
        deliverables JSONB DEFAULT '[]'::jsonb,
        assets_url JSONB DEFAULT '[]'::jsonb,
        testimonials JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        project_id INTEGER UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
        content_json JSONB,
        is_published BOOLEAN DEFAULT FALSE,
        public_slug VARCHAR(100) UNIQUE,
        published_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analysis_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        objective VARCHAR(100),
        tone VARCHAR(50),
        platform_scores JSONB,
        recommended_angles JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS generated_content (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        objective VARCHAR(100),
        tone VARCHAR(50),
        platform VARCHAR(50),
        content_type VARCHAR(50),
        draft_data JSONB,
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_for TIMESTAMP,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_channels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50),
        platform_user_id VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        metadata JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, platform)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        source_platform VARCHAR(50),
        reviewer_name VARCHAR(255),
        rating INTEGER,
        review_text TEXT,
        sentiment VARCHAR(50),
        response_draft TEXT,
        response_tone VARCHAR(50),
        is_responded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_generated_content_project_id ON generated_content(project_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_channels_user_id ON user_channels(user_id);
    `);

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_linkedin_id_unique
      ON users(linkedin_id)
      WHERE linkedin_id IS NOT NULL;
    `);

    await client.query(`
      ALTER TABLE generated_content
        ADD COLUMN IF NOT EXISTS external_post_id TEXT,
        ADD COLUMN IF NOT EXISTS export_payload JSONB DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS exported_at TIMESTAMP;
    `);

    await client.query("COMMIT");
    console.log("Database tables created successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration error:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
