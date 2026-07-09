.PHONY: install update dev build deploy check types check-types format lint ci

install: ## Initialize the project and install dependencies
	@echo "🔧 Initializing the project..."
	pnpm install

update: ## Update dependencies to their latest versions
	@echo "🔄 Updating dependencies..."
	pnpm update

dev: ## Start the Flue dev server (Cloudflare target, port 3583)
	@echo "💻 Starting Flue dev server..."
	pnpm run dev

build: ## Build the Worker bundle (generates dist/worker-agent/wrangler.json)
	@echo "🏗️ Building Flue worker bundle..."
	pnpm run build

deploy: ## Build then deploy the generated config to Cloudflare Workers
	@echo "🚀 Deploying to Cloudflare Workers..."
	pnpm run deploy

check: ## Check the codebase using OXC (oxfmt + oxlint)
	@echo "🔍 Checking codebase..."
	pnpm run format && pnpm run lint

types: ## Generate worker-configuration.d.ts from wrangler bindings
	@echo "📄 Generating TypeScript type definitions..."
	pnpm run types

check-types: ## Type-check the app using TypeScript (tsc --noEmit)
	@echo "🔍 Checking TypeScript types..."
	pnpm run check-types

format: ## Check formatting using oxfmt
	@echo "📝 Checking formatting..."
	pnpm run format

lint: ## Lint the codebase using oxlint
	@echo "🔍 Running code analysis..."
	pnpm run lint

ci: ## Run full checks before committing for CI/CD pipeline
	@echo "🔍 Running CI checks..."
	pnpm run ci
