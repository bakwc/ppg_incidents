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


def main():
    if len(sys.argv) < 2:
        print("Usage: python run.py [backend|frontend]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "backend":
        launch_backend()
    elif command == "frontend":
        launch_frontend()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: backend, frontend")
        sys.exit(1)


if __name__ == "__main__":
    main()

