#!/usr/bin/env python3
import os
import sys
import subprocess


def launch_backend():
    """Launch Django backend in dev mode with fixed DEV secret key"""
    env = os.environ.copy()
    env["SECRET_KEY"] = "dev-secret-key-not-for-production-use"
    env["DEBUG"] = "True"
    
    print("🚀 Launching backend in dev mode...")
    subprocess.run(["poetry", "run", "python", "manage.py", "runserver"], env=env)


def launch_frontend():
    """Launch frontend in dev mode"""
    print("🚀 Launching frontend in dev mode...")
    os.chdir("frontend")
    subprocess.run(["npm", "run", "dev"])


def run_tests():
    """Run tests with pytest, passing all additional arguments"""
    env = os.environ.copy()
    if "SECRET_KEY" not in env:
        env["SECRET_KEY"] = "test-secret-key-for-testing-only"
    if "DEBUG" not in env:
        env["DEBUG"] = "True"
    
    pytest_args = ["poetry", "run", "pytest"] + sys.argv[2:]
    print(f"🧪 Running tests: {' '.join(pytest_args)}")
    result = subprocess.run(pytest_args, env=env)
    sys.exit(result.returncode)


def create_from_url():
    """Create incident from URL using LLM"""
    env = os.environ.copy()
    env["SECRET_KEY"] = "dev-secret-key-not-for-production-use"
    env["DEBUG"] = "True"
    
    cmd = ["poetry", "run", "python", "manage.py", "create_from_url"] + sys.argv[2:]
    print(f"🔗 Creating incident from URL: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=env)
    sys.exit(result.returncode)


def main():
    if len(sys.argv) < 2:
        print("Usage: python run.py [backend|frontend|test|create_from_url]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "backend":
        launch_backend()
    elif command == "frontend":
        launch_frontend()
    elif command == "test":
        run_tests()
    elif command == "create_from_url":
        create_from_url()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: backend, frontend, test, create_from_url")
        sys.exit(1)


if __name__ == "__main__":
    main()

