.DEFAULT_GOAL 	= help

SHELL         	= bash
project       	= janosmiko.github.io
GIT_AUTHOR    	= janosmiko
MAKEFLAGS      += --always-make

help: ## Outputs this help screen
	@grep -E '(^[\/a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

ifeq (, $(shell which brew))
	$(error "No brew in $(PATH).")
endif

.PHONY: deps install run

deps: ## Install required components (hugo, nodejs)
	brew install hugo node

install: ## Install node packages
	@echo "Installing dependencies..."
	npm install

run: ## ## Run hugo in local server mode
	hugo server
