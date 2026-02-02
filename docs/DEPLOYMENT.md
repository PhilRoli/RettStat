# RettStat Deployment Guide

Complete guide for deploying RettStat to production on a Hetzner VPS.

## Quick Start

1. Create Hetzner VPS (CX31 recommended)
2. Configure DNS for rettstat.at
3. Run deployment script
4. Configure environment variables
5. Access <https://rettstat.at>

## Prerequisites

- Hetzner Cloud account
- GitHub account
- Lettermint account for emails
- Domain: rettstat.at

## Server Requirements

**Recommended**: CX31 (4 vCPU, 8GB RAM) - €8.50/month
**Minimum**: CX21 (2 vCPU, 4GB RAM) - €4.50/month
**OS**: Ubuntu 24.04 LTS

## DNS Configuration

| Record | Host   | Value       |
| ------ | ------ | ----------- |
| A      | @      | <server-ip> |
| A      | api    | <server-ip> |
| A      | studio | <server-ip> |
| A      | www    | <server-ip> |

## Deployment Steps

See full guide at: <https://github.com/philroli/rettstat/blob/main/docs/DEPLOYMENT.md>
