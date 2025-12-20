#!/usr/bin/env python3
"""Simple utility to view and filter API logs."""
import json
import sys
from pathlib import Path


def main():
    logs_dir = Path(__file__).parent / 'logs'
    log_files = sorted(logs_dir.glob('api_calls.*.jsonl'))

    if not log_files:
        print(f"No logs files found in {logs_dir}")
        return

    filter_path = sys.argv[1] if len(sys.argv) > 1 else None
    filter_method = sys.argv[2] if len(sys.argv) > 2 else None

    for log_file in log_files:
        with open(log_file, 'r') as f:
            for line in f:
                try:
                    log = json.loads(line)

                    if log.get('event_type') != 'api_call':
                        continue

                    if filter_path and filter_path not in log.get('path', ''):
                        continue

                    if filter_method and log.get('method') != filter_method.upper():
                        continue

                    print(json.dumps(log, indent=2))
                    print('-' * 80)

                except json.JSONDecodeError:
                    continue


if __name__ == '__main__':
    main()

