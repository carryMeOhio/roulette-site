# Deploying to AWS

Step-by-step guide for standing up the full infrastructure (EC2 + PostgreSQL + Nginx + HTTPS) on a fresh AWS account. Everything runs on a single ARM server in `eu-central-1` (Frankfurt).

**Estimated cost: ~$19–20/month** (see breakdown at the bottom).

## Prerequisites (one-time, on your laptop)

1. **AWS account** with billing enabled — https://aws.amazon.com
2. **AWS CLI** authenticated:
   ```bash
   brew install awscli
   aws configure   # paste Access Key ID + Secret from IAM, region: eu-central-1
   ```
   Create the access key in AWS Console → IAM → your user → Security credentials → Create access key. Don't use the root account; create an IAM user with `AdministratorAccess` for this.
3. **Terraform** ≥ 1.5:
   ```bash
   brew install terraform
   ```
4. **An SSH key** (skip if `~/.ssh/id_ed25519.pub` already exists):
   ```bash
   ssh-keygen -t ed25519
   ```
5. **A domain name** you control (any registrar — you'll point an A record at the server in step 4).

## Step 1 — Fill in your secrets

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

| Variable | What to put there |
|---|---|
| `ssh_public_key` | output of `cat ~/.ssh/id_ed25519.pub` |
| `ssh_allowed_cidrs` | CIDRs allowed on port 22 — your IP as `/32`. Find it with `curl ifconfig.me`. `0.0.0.0/0` is rejected. |
| `domain_name` | your bare domain, e.g. `galas-roulette.com` |
| `admin_password` | password for the site's /admin panel |
| `session_secret` | output of `openssl rand -hex 32` |
| `db_password` | strong random password, **no** `'` `@` `/` `?` `#` characters (validated) |

`terraform.tfvars` is gitignored — it never leaves your machine. So is the Terraform state file (`terraform.tfstate`), which also contains these secrets; don't move it anywhere unencrypted.

## Step 2 — Create the infrastructure

```bash
terraform init     # downloads the AWS provider (first time only)
terraform plan     # review: should show ~17 resources to add
terraform apply    # type "yes"
```

Takes ~2 minutes. The server then runs its bootstrap script (installs Node 22, PostgreSQL, Nginx, PM2, creates the DB, writes the env file) for another ~3–5 minutes.

Note the outputs — especially `elastic_ip`. You can re-print them anytime with `terraform output`.

## Step 3 — Deploy the app

```bash
# Wait ~5 min after apply, then:
ssh ubuntu@$(terraform output -raw elastic_ip)

# On the server — confirm bootstrap finished (last line: "Bootstrap complete!"):
sudo tail -5 /var/log/user_data.log

git clone https://github.com/carryMeOhio/roulette-site.git ~/app
cd ~/app && bash scripts/deploy.sh
```

The repo is private, so `git clone` will ask for credentials — use a GitHub fine-grained personal access token (GitHub → Settings → Developer settings → Tokens) as the password, or `gh auth login` on the server.

First-time data import (after deploy.sh succeeds):

```bash
# From your laptop:
scp "../Галас музична рулетка.xlsx" ubuntu@<elastic-ip>:~/app/

# On the server:
cd ~/app
npm run import    # seasons / albums / participants / scores / reviews
npm run covers    # cover art from MusicBrainz, ~1 req/sec
```

At this point `http://<elastic-ip>` already serves the site.

## Step 4 — Domain + HTTPS

1. At your registrar, create two A records pointing to the Elastic IP: `@` and `www`.
2. Wait for DNS to propagate (check with `dig +short yourdomain.com`).
3. On the server:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   Certbot rewrites the Nginx config for HTTPS and installs auto-renewal. Choose "redirect HTTP → HTTPS" when asked.

Done. The site is live.

## Updating the app later

```bash
ssh ubuntu@<elastic-ip>
cd ~/app && bash scripts/deploy.sh   # pulls main, rebuilds, restarts PM2
```

## Tearing it all down

```bash
cd terraform && terraform destroy
```

This deletes everything including the database — back up first if needed:
`ssh ubuntu@<ip> 'sudo -u postgres pg_dump roulette' > backup.sql`

## Monthly cost breakdown (eu-central-1, on-demand)

| Item | Price | Monthly |
|---|---|---|
| EC2 t4g.micro (2 vCPU ARM, 1 GB) | ~$0.0096/hr | ~$7.00 |
| EBS gp3 20 GB root volume | ~$0.095/GB-mo | ~$1.90 |
| Public IPv4 (Elastic IP) | $0.005/hr | ~$3.65 |
| SSM parameters (standard tier) | free | $0 |
| Data transfer out (first 100 GB/mo free) | — | $0 |
| **Total** | | **~$12.50** |

The default is **t4g.micro**. Steady-state serving fits in 1 GB; `next build` peaks
above 1 GB and leans on the 2 GB swapfile (created by the bootstrap) plus `deploy.sh`
pausing the app during the build — so deploys are slower and cause a brief outage,
which is fine for a low-traffic archive.

Other knobs:
- **t4g.small** (2 GB) — change `instance_type` in `terraform/ec2.tf` for faster,
  swap-free builds and no deploy-time outage. Adds ~$7/mo (~$19.50 total).
- **1-year Compute Savings Plan / Reserved Instance** takes ~40% off the EC2 line.
- New AWS accounts get free-tier credits that typically cover the first months entirely.
