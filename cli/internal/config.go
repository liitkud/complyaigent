package internal

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type ExcludeConfig struct {
	Files []string `yaml:"files"`
	Paths []string `yaml:"paths"`
}

type Config struct {
	Backend string        `yaml:"backend"`
	Mode    string        `yaml:"mode"`
	Exclude ExcludeConfig `yaml:"exclude"`
}

func LoadConfig(flagBackend, flagMode string) (Config, error) {
	cfg := Config{
		Backend: "https://aigent.kuyacarlo.dev",
		Mode:    "changes",
	}

	userCfg, err := loadConfigFile(filepath.Join(userConfigDir(), "pg", "config.yaml"))
	if err != nil && !os.IsNotExist(err) {
		return cfg, err
	}
	mergeConfig(&cfg, userCfg)

	projectCfg, err := loadConfigFile(".pg.yaml")
	if err != nil && !os.IsNotExist(err) {
		return cfg, err
	}
	mergeConfig(&cfg, projectCfg)

	if env := os.Getenv("PG_BACKEND"); env != "" {
		cfg.Backend = env
	}
	if env := os.Getenv("PG_MODE"); env != "" {
		cfg.Mode = env
	}

	if flagBackend != "" {
		cfg.Backend = flagBackend
	}
	if flagMode != "" {
		cfg.Mode = flagMode
	}

	cfg.Mode = strings.ToLower(cfg.Mode)
	if cfg.Mode != "changes" && cfg.Mode != "full" {
		return cfg, fmt.Errorf("invalid mode %q, must be changes or full", cfg.Mode)
	}

	return cfg, nil
}

func loadConfigFile(path string) (Config, error) {
	var cfg Config
	data, err := os.ReadFile(path)
	if err != nil {
		return cfg, err
	}
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, fmt.Errorf("invalid YAML in %s: %w", path, err)
	}
	return cfg, nil
}

func mergeConfig(base *Config, override Config) {
	if override.Backend != "" {
		base.Backend = override.Backend
	}
	if override.Mode != "" {
		base.Mode = override.Mode
	}
	if len(override.Exclude.Files) > 0 {
		base.Exclude.Files = override.Exclude.Files
	}
	if len(override.Exclude.Paths) > 0 {
		base.Exclude.Paths = override.Exclude.Paths
	}
}

func userConfigDir() string {
	if cfgDir := os.Getenv("XDG_CONFIG_HOME"); cfgDir != "" {
		return cfgDir
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	return filepath.Join(home, ".config")
}
