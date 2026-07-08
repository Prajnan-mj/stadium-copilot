.PHONY: dev check build docker deploy warm install

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

dev:
	npx concurrently "cd frontend && npm run dev" "cd backend && uvicorn main:app --reload --port 8080"

check:
	cd backend && python -m ruff check .
	cd backend && python -m pytest tests/ -q
	cd frontend && npm run typecheck

build:
	cd frontend && npm run build
	rm -rf backend/static
	cp -r frontend/dist backend/static

docker:
	docker build -t stadium-copilot .

deploy:
	gcloud run deploy stadium-copilot --source . --region asia-south1 \
		--allow-unauthenticated --min-instances 1 \
		--set-env-vars DEMO_MODE=1,SIM_SEED=26 \
		--set-secrets NVIDIA_API_KEY=NVIDIA_API_KEY:latest

warm:
	python backend/warm_cache.py
