package config

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Environment represents the application deployment environment.
type Environment string

const (
	// EnvDevelopment represents local development environment.
	EnvDevelopment Environment = "development"
	// EnvStaging represents staging / pre-production environment.
	EnvStaging Environment = "staging"
	// EnvProduction represents live production environment.
	EnvProduction Environment = "production"
)

// String returns string representation of Environment.
func (e Environment) String() string {
	return string(e)
}

// ParseEnvironment normalizes arbitrary environment strings into canonical Environment types.
// Supports aliases like "dev", "stage", "prod", and case-insensitive variations.
func ParseEnvironment(envStr string) Environment {
	switch strings.ToLower(strings.TrimSpace(envStr)) {
	case "prod", "production":
		return EnvProduction
	case "stage", "staging", "uat":
		return EnvStaging
	case "dev", "development", "":
		return EnvDevelopment
	default:
		return Environment(strings.ToLower(strings.TrimSpace(envStr)))
	}
}

// Config holds all application configuration parameters across environments.
type Config struct {
	// App configurations
	AppName      string
	AppPort      string
	AppEnv       Environment
	LogLevel     string
	ServerHeader string
	Prefork      bool

	// CORS configurations
	CORSAllowOrigins string

	// Database configurations
	DBHost                string
	DBPort                string
	DBUser                string
	DBPassword            string
	DBName                string
	DBSSLMode             string
	DatabaseURL           string
	DBMaxOpenConns        int
	DBMaxIdleConns        int
	DBConnMaxLifetime     time.Duration
	DBConnMaxIdleTime     time.Duration
	DBLogLevel            string // "silent", "error", "warn", "info"
	DBAutoMigrate         bool
	DBAutoSeed            bool
	DBAllowMemoryFallback bool
	DBConnectTimeout      time.Duration
}

// IsDevelopment returns true if current environment is development.
func (c *Config) IsDevelopment() bool {
	return c.AppEnv == EnvDevelopment
}

// IsDev is an alias for IsDevelopment.
func (c *Config) IsDev() bool {
	return c.IsDevelopment()
}

// IsStaging returns true if current environment is staging.
func (c *Config) IsStaging() bool {
	return c.AppEnv == EnvStaging
}

// IsProduction returns true if current environment is production.
func (c *Config) IsProduction() bool {
	return c.AppEnv == EnvProduction
}

// IsProd is an alias for IsProduction.
func (c *Config) IsProd() bool {
	return c.IsProduction()
}

// LoadConfig loads environment configurations with hierarchical precedence:
// 1. Process OS Environment Variables (Highest priority, never overwritten)
// 2. .env.<env>.local (Uncommitted local overrides for active environment)
// 3. .env.local (Uncommitted local overrides)
// 4. .env.<env> (Environment-specific committed defaults)
// 5. .env (Global base fallback defaults)
//
// Optional searchDir can be specified (defaults to current working directory ".").
func LoadConfig(searchDir ...string) *Config {
	baseDir := "."
	if len(searchDir) > 0 && searchDir[0] != "" {
		baseDir = searchDir[0]
	}

	// 1. Determine active environment before loading files.
	// Checked in precedence order: OS Env -> .env.local -> .env -> default (development).
	activeEnv := determineEnvironment(baseDir)

	// 2. Load .env files in order from lowest to highest priority into a merged map.
	// Later files override earlier files.
	envFiles := []string{
		filepath.Join(baseDir, ".env"),
		filepath.Join(baseDir, fmt.Sprintf(".env.%s", activeEnv)),
		filepath.Join(baseDir, ".env.local"),
		filepath.Join(baseDir, fmt.Sprintf(".env.%s.local", activeEnv)),
	}

	fileMap := make(map[string]string)
	for _, file := range envFiles {
		if fileExists(file) {
			if m, err := godotenv.Read(file); err == nil {
				for k, v := range m {
					fileMap[k] = v
				}
			}
		}
	}

	// Set process environment for keys that are not already set in OS.
	// Uses os.LookupEnv to avoid overwriting variables that were explicitly set to empty strings.
	for k, v := range fileMap {
		if _, exists := os.LookupEnv(k); !exists {
			_ = os.Setenv(k, v)
		}
	}

	// 3. Populate Config with environment-sensitive defaults
	return buildConfig(activeEnv)
}

// determineEnvironment inspects OS environment variables and .env files to identify the target environment.
func determineEnvironment(baseDir string) Environment {
	// 1. Check OS environment variables
	if val := os.Getenv("APP_ENV"); val != "" {
		return ParseEnvironment(val)
	}
	if val := os.Getenv("ENVIRONMENT"); val != "" {
		return ParseEnvironment(val)
	}
	if val := os.Getenv("ENV"); val != "" {
		return ParseEnvironment(val)
	}

	// 2. Peek into .env.local (higher priority than .env)
	localEnvPath := filepath.Join(baseDir, ".env.local")
	if fileExists(localEnvPath) {
		if envMap, err := godotenv.Read(localEnvPath); err == nil {
			if val, ok := envMap["APP_ENV"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
			if val, ok := envMap["ENVIRONMENT"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
			if val, ok := envMap["ENV"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
		}
	}

	// 3. Peek into .env
	dotEnvPath := filepath.Join(baseDir, ".env")
	if fileExists(dotEnvPath) {
		if envMap, err := godotenv.Read(dotEnvPath); err == nil {
			if val, ok := envMap["APP_ENV"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
			if val, ok := envMap["ENVIRONMENT"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
			if val, ok := envMap["ENV"]; ok && strings.TrimSpace(val) != "" {
				return ParseEnvironment(val)
			}
		}
	}

	return EnvDevelopment
}

func buildConfig(env Environment) *Config {
	port := getEnv("PORT", "3000")
	appName := getEnv("APP_NAME", fmt.Sprintf("Tuwaktu API [%s]", env))
	prefork := getEnvAsBool("SERVER_PREFORK", false)

	// Default log levels and server headers per environment
	var defaultLogLevel string
	var defaultServerHeader string
	var defaultCORSOrigins string

	var defaultDBName string
	var defaultDBPassword string
	var defaultDBSSLMode string
	var defaultDBMaxOpenConns int
	var defaultDBMaxIdleConns int
	var defaultDBConnMaxLifetime time.Duration
	var defaultDBConnMaxIdleTime time.Duration
	var defaultDBLogLevel string
	var defaultDBAutoMigrate bool
	var defaultDBAutoSeed bool
	var defaultDBAllowMemoryFallback bool
	var defaultDBConnectTimeout time.Duration

	switch env {
	case EnvProduction:
		defaultLogLevel = "warn"
		defaultServerHeader = "" // Omit Server header in production for security
		defaultCORSOrigins = "https://tuwaktu.com,https://www.tuwaktu.com"

		defaultDBName = "tuwaktu_prod"
		defaultDBPassword = ""
		defaultDBSSLMode = "require"
		defaultDBMaxOpenConns = 50
		defaultDBMaxIdleConns = 10
		defaultDBConnMaxLifetime = 15 * time.Minute
		defaultDBConnMaxIdleTime = 5 * time.Minute
		defaultDBLogLevel = "error"
		defaultDBAutoMigrate = false
		defaultDBAutoSeed = false
		defaultDBAllowMemoryFallback = false
		defaultDBConnectTimeout = 10 * time.Second

	case EnvStaging:
		defaultLogLevel = "info"
		defaultServerHeader = "Fiber"
		defaultCORSOrigins = "https://staging.tuwaktu.com,http://localhost:3000"

		defaultDBName = "tuwaktu_staging"
		defaultDBPassword = "postgres"
		defaultDBSSLMode = "disable"
		defaultDBMaxOpenConns = 25
		defaultDBMaxIdleConns = 5
		defaultDBConnMaxLifetime = 30 * time.Minute
		defaultDBConnMaxIdleTime = 5 * time.Minute
		defaultDBLogLevel = "warn"
		defaultDBAutoMigrate = true
		defaultDBAutoSeed = false
		defaultDBAllowMemoryFallback = false
		defaultDBConnectTimeout = 5 * time.Second

	default: // EnvDevelopment
		defaultLogLevel = "debug"
		defaultServerHeader = "Fiber"
		defaultCORSOrigins = "*"

		defaultDBName = "tuwaktu_dev"
		defaultDBPassword = "postgres"
		defaultDBSSLMode = "disable"
		defaultDBMaxOpenConns = 10
		defaultDBMaxIdleConns = 2
		defaultDBConnMaxLifetime = 30 * time.Minute
		defaultDBConnMaxIdleTime = 5 * time.Minute
		defaultDBLogLevel = "info"
		defaultDBAutoMigrate = true
		defaultDBAutoSeed = true
		defaultDBAllowMemoryFallback = true
		defaultDBConnectTimeout = 3 * time.Second
	}

	logLevel := getEnv("LOG_LEVEL", defaultLogLevel)
	// Server header: empty string is a valid configuration to suppress the header
	serverHeader := getEnvAllowEmpty("SERVER_HEADER", defaultServerHeader)
	corsOrigins := getEnv("CORS_ALLOWED_ORIGINS", defaultCORSOrigins)

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	// DB Password: empty string is a valid password (e.g. local PostgreSQL with trust auth)
	dbPassword := getEnvAllowEmpty("DB_PASSWORD", defaultDBPassword)
	dbName := getEnv("DB_NAME", defaultDBName)
	dbSSLMode := getEnv("DB_SSLMODE", defaultDBSSLMode)

	dbMaxOpenConns := getEnvAsInt("DB_MAX_OPEN_CONNS", defaultDBMaxOpenConns, 1)
	dbMaxIdleConns := getEnvAsInt("DB_MAX_IDLE_CONNS", defaultDBMaxIdleConns, 0)
	dbConnMaxLifetime := getEnvAsDuration("DB_CONN_MAX_LIFETIME", defaultDBConnMaxLifetime)
	dbConnMaxIdleTime := getEnvAsDuration("DB_CONN_MAX_IDLE_TIME", defaultDBConnMaxIdleTime)
	dbLogLevel := getEnv("DB_LOG_LEVEL", defaultDBLogLevel)
	dbAutoMigrate := getEnvAsBool("DB_AUTO_MIGRATE", defaultDBAutoMigrate)
	dbAutoSeed := getEnvAsBool("DB_AUTO_SEED", defaultDBAutoSeed)
	dbAllowMemoryFallback := getEnvAsBool("DB_ALLOW_MEMORY_FALLBACK", defaultDBAllowMemoryFallback)
	dbConnectTimeout := getEnvAsDuration("DB_CONNECT_TIMEOUT", defaultDBConnectTimeout)

	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL != "" {
		// When DATABASE_URL is explicitly provided, synchronize individual connection fields
		if parsedURL, err := url.Parse(dbURL); err == nil {
			if h := parsedURL.Hostname(); h != "" && os.Getenv("DB_HOST") == "" {
				dbHost = h
			}
			if p := parsedURL.Port(); p != "" && os.Getenv("DB_PORT") == "" {
				dbPort = p
			}
			if u := parsedURL.User.Username(); u != "" && os.Getenv("DB_USER") == "" {
				dbUser = u
			}
			if pass, ok := parsedURL.User.Password(); ok && os.Getenv("DB_PASSWORD") == "" {
				dbPassword = pass
			}
			if path := strings.TrimPrefix(parsedURL.Path, "/"); path != "" && os.Getenv("DB_NAME") == "" {
				dbName = path
			}
			if ssl := parsedURL.Query().Get("sslmode"); ssl != "" && os.Getenv("DB_SSLMODE") == "" {
				dbSSLMode = ssl
			}
		}
	} else {
		timeoutSec := int(dbConnectTimeout.Seconds())
		if timeoutSec <= 0 {
			timeoutSec = 3
		}

		var userInfo string
		if dbPassword != "" {
			userInfo = fmt.Sprintf("%s:%s", dbUser, url.QueryEscape(dbPassword))
		} else {
			userInfo = dbUser
		}

		dbURL = fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s&connect_timeout=%d",
			userInfo, dbHost, dbPort, dbName, dbSSLMode, timeoutSec)
	}

	return &Config{
		AppName:               appName,
		AppPort:               port,
		AppEnv:                env,
		LogLevel:              logLevel,
		ServerHeader:          serverHeader,
		Prefork:               prefork,
		CORSAllowOrigins:      corsOrigins,
		DBHost:                dbHost,
		DBPort:                dbPort,
		DBUser:                dbUser,
		DBPassword:            dbPassword,
		DBName:                dbName,
		DBSSLMode:             dbSSLMode,
		DatabaseURL:           dbURL,
		DBMaxOpenConns:        dbMaxOpenConns,
		DBMaxIdleConns:        dbMaxIdleConns,
		DBConnMaxLifetime:     dbConnMaxLifetime,
		DBConnMaxIdleTime:     dbConnMaxIdleTime,
		DBLogLevel:            dbLogLevel,
		DBAutoMigrate:         dbAutoMigrate,
		DBAutoSeed:            dbAutoSeed,
		DBAllowMemoryFallback: dbAllowMemoryFallback,
		DBConnectTimeout:      dbConnectTimeout,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		if trimmed := strings.TrimSpace(val); trimmed != "" {
			return trimmed
		}
	}
	return fallback
}

func getEnvAllowEmpty(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return strings.TrimSpace(val)
	}
	return fallback
}

func getEnvAsInt(key string, fallback int, minVal int) int {
	valStr := strings.TrimSpace(os.Getenv(key))
	if valStr == "" {
		return fallback
	}
	val, err := strconv.Atoi(valStr)
	if err != nil || val < minVal {
		return fallback
	}
	return val
}

func getEnvAsBool(key string, fallback bool) bool {
	valStr := strings.TrimSpace(os.Getenv(key))
	if valStr == "" {
		return fallback
	}
	switch strings.ToLower(valStr) {
	case "true", "1", "yes", "on", "t":
		return true
	case "false", "0", "no", "off", "f":
		return false
	default:
		return fallback
	}
}

func getEnvAsDuration(key string, fallback time.Duration) time.Duration {
	valStr := strings.TrimSpace(os.Getenv(key))
	if valStr == "" {
		return fallback
	}
	// Try parsing standard Go duration string (e.g., "30m", "5s")
	if dur, err := time.ParseDuration(valStr); err == nil && dur > 0 {
		return dur
	}
	// Fallback: try parsing as integer seconds
	if sec, err := strconv.Atoi(valStr); err == nil && sec > 0 {
		return time.Duration(sec) * time.Second
	}
	return fallback
}

func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}
