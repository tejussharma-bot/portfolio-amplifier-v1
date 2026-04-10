async function runMigrations(client) {
  // Users table - simplified for pg-mem compatibility
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255),
      full_name VARCHAR(255),
      account_type VARCHAR(50),
      professional_role VARCHAR(120),
      role VARCHAR(50),
      website VARCHAR(255),
      industry VARCHAR(120),
      services_offered TEXT,
      brand_voice VARCHAR(50),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Add constraints separately for pg-mem compatibility
  try {
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)`);
  } catch (error) {
    // Index might already exist, continue
  }

  // User preferences table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      channels_used TEXT,
      first_goal VARCHAR(100),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Workspace settings table
  await client.query(`
    CREATE TABLE IF NOT EXISTS workspace_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      default_objective VARCHAR(100),
      default_tone VARCHAR(50),
      default_review_tone VARCHAR(50),
      timezone VARCHAR(100),
      publishing_defaults TEXT,
      notification_preferences TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  try {
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_settings_user_id ON workspace_settings(user_id)`);
  } catch (error) {
    // Index might already exist, continue
  }

  // Projects table
  await client.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      client_name VARCHAR(255),
      category VARCHAR(100),
      industry VARCHAR(100),
      timeline VARCHAR(120),
      source_url TEXT,
      status VARCHAR(50),
      challenge_text TEXT,
      solution_text TEXT,
      results_text TEXT,
      deliverables TEXT,
      assets_url TEXT,
      testimonials TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Portfolios table
  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      content_json TEXT,
      is_published BOOLEAN,
      public_slug VARCHAR(100),
      published_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Analysis results table
  await client.query(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      objective VARCHAR(100),
      tone VARCHAR(50),
      platform_scores TEXT,
      recommended_angles TEXT,
      created_at TIMESTAMP
    );
  `);

  // Generated content table
  await client.query(`
    CREATE TABLE IF NOT EXISTS generated_content (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      objective VARCHAR(100),
      tone VARCHAR(50),
      platform VARCHAR(50),
      content_type VARCHAR(50),
      draft_data TEXT,
      status VARCHAR(50),
      scheduled_for TIMESTAMP,
      published_at TIMESTAMP,
      created_at TIMESTAMP
    );
  `);

  // User channels table
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_channels (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      platform VARCHAR(50),
      platform_user_id VARCHAR(255),
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at TIMESTAMP,
      metadata TEXT,
      is_active BOOLEAN,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Reviews table
  await client.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      project_id INTEGER,
      source_platform VARCHAR(50),
      reviewer_name VARCHAR(255),
      rating INTEGER,
      review_text TEXT,
      sentiment VARCHAR(50),
      response_draft TEXT,
      response_tone VARCHAR(50),
      is_responded BOOLEAN,
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    );
  `);

  // Create indexes
  try {
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_project_id ON portfolios(project_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_public_slug ON portfolios(public_slug)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_channels_user_platform ON user_channels(user_id, platform)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_generated_content_project_id ON generated_content(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_channels_user_id ON user_channels(user_id)`);
  } catch (error) {
    // Indexes might already exist, continue
  }

  // Add additional columns (these will be skipped if they already exist in pg-mem)
  try {
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255)
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_linkedin_id ON users(linkedin_id)`);
  } catch (error) {
    // Column might already exist
  }

  try {
    await client.query(`
      ALTER TABLE generated_content
      ADD COLUMN IF NOT EXISTS external_post_id TEXT,
      ADD COLUMN IF NOT EXISTS export_payload TEXT,
      ADD COLUMN IF NOT EXISTS exported_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS portfolio_snapshot TEXT,
      ADD COLUMN IF NOT EXISTS source_portfolio_updated_at TIMESTAMP
    `);
  } catch (error) {
    // Columns might already exist
  }

  try {
    await client.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS build_stage VARCHAR(80),
      ADD COLUMN IF NOT EXISTS build_progress INTEGER,
      ADD COLUMN IF NOT EXISTS build_started_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS build_completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_build_error TEXT
    `);
  } catch (error) {
    // Columns might already exist
  }

  try {
    await client.query(`
      ALTER TABLE user_channels
      ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP
    `);
  } catch (error) {
    // Column might already exist
  }
}

module.exports = {
  runMigrations
};
