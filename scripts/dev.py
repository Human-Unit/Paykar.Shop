"""Optional cross-platform Docker helpers; Python standard library only."""

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", help="Override the Compose project name.")
    parser.add_argument("--env-file", help="Use an alternate environment file.")
    parser.add_argument(
        "command",
        choices=["up", "down", "rebuild", "logs", "migrate", "seed", "test", "verify", "reset", "admin:create"],
    )
    parser.add_argument("--service", choices=["web", "api", "postgres", "seed"])
    parser.add_argument("--follow", action="store_true", help="Follow logs until interrupted.")
    parser.add_argument("--confirm-delete-local-data", action="store_true")
    args = parser.parse_args()
    if args.command == "reset" and not args.confirm_delete_local_data:
        parser.error(
            "reset deletes the project's database volume; require --confirm-delete-local-data"
        )
    base = [
        "docker",
        "compose",
        "--project-directory",
        str(ROOT),
        "-f",
        str(ROOT / "docker-compose.yml"),
    ]
    if args.project:
        base += ["-p", args.project]
    if args.env_file:
        base += ["--env-file", str(Path(args.env_file).resolve())]

    def run(*command):
        subprocess.run([*base, *command], cwd=ROOT, check=True)

    if args.command == "up":
        run("up", "-d", "--build", "--wait")
    elif args.command == "down":
        run("down")
    elif args.command == "rebuild":
        run("up", "-d", "--build", "--force-recreate", "--wait")
    elif args.command == "logs":
        run(
            "logs",
            "--tail",
            "100",
            *(["--follow"] if args.follow else []),
            *([args.service] if args.service else []),
        )
    elif args.command == "migrate":
        run("exec", "-T", "api", "alembic", "upgrade", "head")
    elif args.command == "seed":
        run("run", "--rm", "seed", "python", "/seed/seed.py")
    elif args.command == "admin:create":
        run("exec", "api", "python", "tools/create_admin.py")
    elif args.command in {"test", "verify"}:
        # Backend verification creates and removes its own uniquely named test DB.
        run("exec", "-T", "api", "python", "tools/verify.py")
        command = ("run", "--rm", "--no-deps", "--build", "web-checks")
        if args.command == "test":
            run(*command, "sh", "-c", "node --test tests/*.test.mjs")
        else:
            run(*command)
    elif args.command == "reset":
        run("down", "--volumes")
        run("up", "-d", "--build", "--wait")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode) from None
