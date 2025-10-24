import csv
import subprocess

# Get git log output
git_log = subprocess.run(
    [
        "git", "log",
        "--pretty=format:%H;%cn;%ad;%s;%b",
        "--date=format:%Y-%m-%d;%H:%M:%S"
    ],
    capture_output=True,
    text=True
).stdout.strip()

rows = []
for line in git_log.split("\n"):
    parts = line.split(";", 5)
    if len(parts) == 6:
        commit_hash, committer, date, time, title, description = parts
        rows.append([commit_hash, committer, date, time, title, description])

with open("git_commits.csv", "w", newline="") as f:
    writer = csv.writer(f, delimiter=';')
    writer.writerow(["Commit Hash", "Committer", "Date", "Time", "Title", "Description"])
    writer.writerows(rows)
