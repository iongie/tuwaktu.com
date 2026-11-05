package config_test

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"tuwaktu.com/internal/config"
)

func cleanEnv(t *testing.T) {
	t.Helper()
	keys := []string{
		"APP_ENV", "ENVIRONMENT", "ENV", "PORT", "APP_NAME", "LOG_LEVEL",
		"SERVER_HEADER", "SERVER_PREFORK", "CORS_ALLOWED_ORIGINS",
		"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
		"DB_SSLMODE", "DATABASE_URL", "DB_MAX_OPEN_CONNS", "DB_MAX_IDLE_CONNS",
		"DB_CONN_MAX_LIFETIME", "DB_CONN_MAX_IDLE_TIME", "DB_LOG_LEVEL",
		"DB_AUTO_MIGRATE", "DB_AUTO_SEED", "DB_ALLOW_MEMORY_FALLBACK", "DB_CONNECT_TIMEOUT",
	}
	for _, k := range keys {
		_ = os.Unsetenv(k)
	}
	t.Cleanup(func() {
		for _, k := range keys {
			_ = os.Unsetenv(k)
		}
	})
}

func TestParseEnvironment(t *testing.T) {
	tests := []struct {
		input    string
		expected config.Environment
	}{
		{"", config.EnvDevelopment},
		{"dev", config.EnvDevelopment},
		{"DEV", config.EnvDevelopment},
		{"development", config.EnvDevelopment},
		{"Development", config.EnvDevelopment},
		{"  dev  ", config.EnvDevelopment},
		{"stage", config.EnvStaging},
		{"staging", config.EnvStaging},
		{"STAGING", config.EnvStaging},
		{"uat", config.EnvStaging},
		{"prod", config.EnvProduction},
		{"PROD", config.EnvProduction},
		{"production", config.EnvProduction},
		{"Production", config.EnvProduction},
		{"custom", config.Environment("custom")},
	}

	for _, tt := range tests {
		t.Run("input_"+tt.input, func(t *testing.T) {
			res := config.ParseEnvironment(tt.input)
			assert.Equal(t, tt.expected, res)
		})
	}
}

func TestConfig_EnvironmentPredicates(t *testing.T) {
	devCfg := &config.Config{AppEnv: config.EnvDevelopment}
	assert.True(t, devCfg.IsDevelopment())
	assert.True(t, devCfg.IsDev())
	assert.False(t, devCfg.IsStaging())
	assert.False(t, devCfg.IsProduction())
	assert.False(t, devCfg.IsProd())

	stagingCfg := &config.Config{AppEnv: config.EnvStaging}
	assert.False(t, stagingCfg.IsDevelopment())
	assert.False(t, stagingCfg.IsDev())
	assert.True(t, stagingCfg.IsStaging())
	assert.False(t, stagingCfg.IsProduction())
	assert.False(t, stagingCfg.IsProd())

	prodCfg := &config.Config{AppEnv: config.EnvProduction}
	assert.False(t, prodCfg.IsDevelopment())
	assert.False(t, prodCfg.IsDev())
	assert.False(t, prodCfg.IsStaging())
	assert.True(t, prodCfg.IsProduction())
	assert.True(t, prodCfg.IsProd())
}

func TestLoadConfig_DefaultsByEnvironment(t *testing.T) {
	t.Run("development environment defaults", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		cfg := config.LoadConfig(t.TempDir()) // Use empty dir so no .env files are loaded

		assert.Equal(t, config.EnvDevelopment, cfg.AppEnv)
		assert.Equal(t, "debug", cfg.LogLevel)
		assert.Equal(t, "Fiber", cfg.ServerHeader)
		assert.False(t, cfg.Prefork)
		assert.Equal(t, "*", cfg.CORSAllowOrigins)
		assert.Equal(t, "tuwaktu_dev", cfg.DBName)
		assert.Equal(t, "disable", cfg.DBSSLMode)
		assert.Equal(t, 10, cfg.DBMaxOpenConns)
		assert.Equal(t, 2, cfg.DBMaxIdleConns)
		assert.Equal(t, 30*time.Minute, cfg.DBConnMaxLifetime)
		assert.Equal(t, 5*time.Minute, cfg.DBConnMaxIdleTime)
		assert.Equal(t, "info", cfg.DBLogLevel)
		assert.True(t, cfg.DBAutoMigrate)
		assert.True(t, cfg.DBAutoSeed)
		assert.True(t, cfg.DBAllowMemoryFallback)
		assert.Equal(t, 3*time.Second, cfg.DBConnectTimeout)
		assert.Contains(t, cfg.DatabaseURL, "tuwaktu_dev")
		assert.Contains(t, cfg.DatabaseURL, "sslmode=disable")
	})

	t.Run("staging environment defaults", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "staging")
		cfg := config.LoadConfig(t.TempDir())

		assert.Equal(t, config.EnvStaging, cfg.AppEnv)
		assert.Equal(t, "info", cfg.LogLevel)
		assert.Equal(t, "Fiber", cfg.ServerHeader)
		assert.False(t, cfg.Prefork)
		assert.Contains(t, cfg.CORSAllowOrigins, "staging.tuwaktu.com")
		assert.Equal(t, "tuwaktu_staging", cfg.DBName)
		assert.Equal(t, "disable", cfg.DBSSLMode)
		assert.Equal(t, 25, cfg.DBMaxOpenConns)
		assert.Equal(t, 5, cfg.DBMaxIdleConns)
		assert.Equal(t, 30*time.Minute, cfg.DBConnMaxLifetime)
		assert.Equal(t, 5*time.Minute, cfg.DBConnMaxIdleTime)
		assert.Equal(t, "warn", cfg.DBLogLevel)
		assert.True(t, cfg.DBAutoMigrate)
		assert.False(t, cfg.DBAutoSeed)
		assert.False(t, cfg.DBAllowMemoryFallback)
		assert.Equal(t, 5*time.Second, cfg.DBConnectTimeout)
		assert.Contains(t, cfg.DatabaseURL, "tuwaktu_staging")
	})

	t.Run("production environment defaults", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "production")
		cfg := config.LoadConfig(t.TempDir())

		assert.Equal(t, config.EnvProduction, cfg.AppEnv)
		assert.Equal(t, "warn", cfg.LogLevel)
		assert.Equal(t, "", cfg.ServerHeader) // empty header in prod for security
		assert.False(t, cfg.Prefork)
		assert.Contains(t, cfg.CORSAllowOrigins, "tuwaktu.com")
		assert.Equal(t, "tuwaktu_prod", cfg.DBName)
		assert.Equal(t, "require", cfg.DBSSLMode)
		assert.Equal(t, 50, cfg.DBMaxOpenConns)
		assert.Equal(t, 10, cfg.DBMaxIdleConns)
		assert.Equal(t, 15*time.Minute, cfg.DBConnMaxLifetime)
		assert.Equal(t, 5*time.Minute, cfg.DBConnMaxIdleTime)
		assert.Equal(t, "error", cfg.DBLogLevel)
		assert.False(t, cfg.DBAutoMigrate)
		assert.False(t, cfg.DBAutoSeed)
		assert.False(t, cfg.DBAllowMemoryFallback)
		assert.Equal(t, 10*time.Second, cfg.DBConnectTimeout)
		assert.Contains(t, cfg.DatabaseURL, "tuwaktu_prod")
		assert.Contains(t, cfg.DatabaseURL, "sslmode=require")
	})
}

func TestLoadConfig_EnvironmentVariablesPriority(t *testing.T) {
	t.Run("ENVIRONMENT alias sets staging", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("ENVIRONMENT", "stage")
		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, config.EnvStaging, cfg.AppEnv)
	})

	t.Run("explicit overrides via OS env vars", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "production")
		t.Setenv("PORT", "9090")
		t.Setenv("DB_HOST", "custom-postgres.internal")
		t.Setenv("DB_PORT", "5433")
		t.Setenv("DB_USER", "custom_admin")
		t.Setenv("DB_PASSWORD", "p@ss:word#123")
		t.Setenv("DB_NAME", "custom_db")
		t.Setenv("DB_MAX_OPEN_CONNS", "120")
		t.Setenv("DB_MAX_IDLE_CONNS", "30")
		t.Setenv("DB_CONN_MAX_LIFETIME", "45m")
		t.Setenv("DB_CONN_MAX_IDLE_TIME", "10m")
		t.Setenv("DB_AUTO_MIGRATE", "true")
		t.Setenv("DB_AUTO_SEED", "true")
		t.Setenv("DB_ALLOW_MEMORY_FALLBACK", "true")
		t.Setenv("SERVER_PREFORK", "true")
		t.Setenv("SERVER_HEADER", "CustomServer")
		t.Setenv("CORS_ALLOWED_ORIGINS", "https://custom.app")

		cfg := config.LoadConfig(t.TempDir())

		assert.Equal(t, config.EnvProduction, cfg.AppEnv)
		assert.Equal(t, "9090", cfg.AppPort)
		assert.Equal(t, "custom-postgres.internal", cfg.DBHost)
		assert.Equal(t, "5433", cfg.DBPort)
		assert.Equal(t, "custom_admin", cfg.DBUser)
		assert.Equal(t, "p@ss:word#123", cfg.DBPassword)
		assert.Equal(t, "custom_db", cfg.DBName)
		assert.Equal(t, 120, cfg.DBMaxOpenConns)
		assert.Equal(t, 30, cfg.DBMaxIdleConns)
		assert.Equal(t, 45*time.Minute, cfg.DBConnMaxLifetime)
		assert.Equal(t, 10*time.Minute, cfg.DBConnMaxIdleTime)
		assert.True(t, cfg.DBAutoMigrate)
		assert.True(t, cfg.DBAutoSeed)
		assert.True(t, cfg.DBAllowMemoryFallback)
		assert.True(t, cfg.Prefork)
		assert.Equal(t, "CustomServer", cfg.ServerHeader)
		assert.Equal(t, "https://custom.app", cfg.CORSAllowOrigins)
		assert.Contains(t, cfg.DatabaseURL, "custom_admin:p%40ss%3Aword%23123@custom-postgres.internal:5433/custom_db")
	})

	t.Run("DATABASE_URL takes direct precedence over individual fields", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "production")
		t.Setenv("DB_HOST", "ignored-host")
		t.Setenv("DATABASE_URL", "postgres://override_user:override_pass@special-host:5432/override_db?sslmode=disable")

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, "postgres://override_user:override_pass@special-host:5432/override_db?sslmode=disable", cfg.DatabaseURL)
	})
}

func TestLoadConfig_DotenvPrecedenceHierarchy(t *testing.T) {
	cleanEnv(t)

	// Create a temporary sandbox directory with layered .env files
	tempDir := t.TempDir()

	// 1. Base .env file
	err := os.WriteFile(filepath.Join(tempDir, ".env"), []byte(
		"PORT=8000\n"+
			"DB_NAME=base_db\n"+
			"CORS_ALLOWED_ORIGINS=https://base.org\n"+
			"LOG_LEVEL=error\n",
	), 0644)
	require.NoError(t, err)

	// 2. Environment-specific .env.development
	err = os.WriteFile(filepath.Join(tempDir, ".env.development"), []byte(
		"PORT=8001\n"+
			"DB_NAME=dev_db\n"+
			"LOG_LEVEL=debug\n",
	), 0644)
	require.NoError(t, err)

	// 3. Local override .env.development.local
	err = os.WriteFile(filepath.Join(tempDir, ".env.development.local"), []byte(
		"PORT=8002\n"+
			"DB_NAME=dev_local_db\n",
	), 0644)
	require.NoError(t, err)

	t.Setenv("APP_ENV", "development")
	cfg := config.LoadConfig(tempDir)

	// PORT: specified in base (8000), dev (8001), dev.local (8002) -> 8002 wins
	assert.Equal(t, "8002", cfg.AppPort)
	// DB_NAME: specified in base, dev, dev.local -> dev_local_db wins
	assert.Equal(t, "dev_local_db", cfg.DBName)
	// LOG_LEVEL: specified in base (error), dev (debug) -> debug wins
	assert.Equal(t, "debug", cfg.LogLevel)
	// CORS_ALLOWED_ORIGINS: only in base -> https://base.org wins
	assert.Equal(t, "https://base.org", cfg.CORSAllowOrigins)
}

func TestLoadConfig_DotenvPeekingEnv(t *testing.T) {
	cleanEnv(t)

	tempDir := t.TempDir()
	// No OS env vars set, but .env sets APP_ENV=staging
	err := os.WriteFile(filepath.Join(tempDir, ".env"), []byte(
		"APP_ENV=staging\n"+
			"PORT=8888\n",
	), 0644)
	require.NoError(t, err)

	cfg := config.LoadConfig(tempDir)
	assert.Equal(t, config.EnvStaging, cfg.AppEnv)
	assert.Equal(t, "8888", cfg.AppPort)
	assert.True(t, cfg.IsStaging())
}

func TestLoadConfig_ParsingVariations(t *testing.T) {
	t.Run("boolean false strings and invalid fallback", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("DB_AUTO_MIGRATE", "false")
		t.Setenv("DB_AUTO_SEED", "0")
		t.Setenv("DB_ALLOW_MEMORY_FALLBACK", "no")
		t.Setenv("SERVER_PREFORK", "off")

		cfg := config.LoadConfig(t.TempDir())
		assert.False(t, cfg.DBAutoMigrate)
		assert.False(t, cfg.DBAutoSeed)
		assert.False(t, cfg.DBAllowMemoryFallback)
		assert.False(t, cfg.Prefork)
	})

	t.Run("duration parsed from integer seconds and fallback", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("DB_CONNECT_TIMEOUT", "45")                 // integer seconds
		t.Setenv("DB_CONN_MAX_LIFETIME", "invalid-duration") // should fallback to default 30m

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, 45*time.Second, cfg.DBConnectTimeout)
		assert.Equal(t, 30*time.Minute, cfg.DBConnMaxLifetime)
	})

	t.Run("integer invalid format falls back to default", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("DB_MAX_OPEN_CONNS", "not-a-number")

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, 10, cfg.DBMaxOpenConns)
	})

	t.Run("boundary integer validation preserves 0 for idle conns but enforces positive for open conns", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("DB_MAX_OPEN_CONNS", "0") // invalid, should fallback to 10
		t.Setenv("DB_MAX_IDLE_CONNS", "0") // valid 0 idle conns

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, 10, cfg.DBMaxOpenConns)
		assert.Equal(t, 0, cfg.DBMaxIdleConns)
	})
}

func TestLoadConfig_DotenvLocalPeeking(t *testing.T) {
	cleanEnv(t)
	tempDir := t.TempDir()

	// .env.staging has staging db name
	err := os.WriteFile(filepath.Join(tempDir, ".env.staging"), []byte(
		"DB_NAME=staging_correct_db\n",
	), 0644)
	require.NoError(t, err)

	// .env.development has dev db name
	err = os.WriteFile(filepath.Join(tempDir, ".env.development"), []byte(
		"DB_NAME=dev_wrong_db\n",
	), 0644)
	require.NoError(t, err)

	// .env.local sets APP_ENV=staging
	err = os.WriteFile(filepath.Join(tempDir, ".env.local"), []byte(
		"APP_ENV=staging\n",
	), 0644)
	require.NoError(t, err)

	cfg := config.LoadConfig(tempDir)
	assert.Equal(t, config.EnvStaging, cfg.AppEnv)
	assert.Equal(t, "staging_correct_db", cfg.DBName)
	assert.True(t, cfg.IsStaging())
}

func TestLoadConfig_EmptyStringValues(t *testing.T) {
	t.Run("empty DB_PASSWORD is preserved in development", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("DB_PASSWORD", "")

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, "", cfg.DBPassword)
		// DatabaseURL should not have userInfo password
		assert.NotContains(t, cfg.DatabaseURL, ":@")
	})

	t.Run("empty SERVER_HEADER is preserved in staging", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "staging")
		t.Setenv("SERVER_HEADER", "")

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, "", cfg.ServerHeader)
	})

	t.Run("empty PORT falls back to 3000", func(t *testing.T) {
		cleanEnv(t)
		t.Setenv("APP_ENV", "development")
		t.Setenv("PORT", "")

		cfg := config.LoadConfig(t.TempDir())
		assert.Equal(t, "3000", cfg.AppPort)
	})
}

func TestLoadConfig_DatabaseURLSynchronization(t *testing.T) {
	cleanEnv(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://admin_usr:super_sec@db.mycluster.org:5433/prod_cluster_db?sslmode=verify-ca")

	cfg := config.LoadConfig(t.TempDir())
	assert.Equal(t, "db.mycluster.org", cfg.DBHost)
	assert.Equal(t, "5433", cfg.DBPort)
	assert.Equal(t, "admin_usr", cfg.DBUser)
	assert.Equal(t, "super_sec", cfg.DBPassword)
	assert.Equal(t, "prod_cluster_db", cfg.DBName)
	assert.Equal(t, "verify-ca", cfg.DBSSLMode)
	assert.Equal(t, "postgres://admin_usr:super_sec@db.mycluster.org:5433/prod_cluster_db?sslmode=verify-ca", cfg.DatabaseURL)
}

func TestLoadConfig_OSVariablesNeverOverwrittenByDotenv(t *testing.T) {
	cleanEnv(t)
	tempDir := t.TempDir()

	err := os.WriteFile(filepath.Join(tempDir, ".env"), []byte(
		"DB_PASSWORD=secret_dotenv_password\n",
	), 0644)
	require.NoError(t, err)

	// OS environment has explicitly empty password
	t.Setenv("DB_PASSWORD", "")
	t.Setenv("APP_ENV", "development")

	cfg := config.LoadConfig(tempDir)
	assert.Equal(t, "", cfg.DBPassword)
}
