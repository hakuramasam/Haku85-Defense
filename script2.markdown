# 🚀 HAKU Tower Defense - Complete Setup Guide

This guide will walk you through setting up the HAKU Tower Defense game from scratch.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Local Development](#local-development)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Web Browser**: Chrome, Firefox, Edge, or Brave (latest version)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Web3 Wallet**: [MetaMask](https://metamask.io/) or similar
- **Text Editor**: VS Code, Sublime, or any code editor

### Required Accounts
- **GitHub Account**: [Sign up](https://github.com/join)
- **Supabase Account**: [Sign up](https://supabase.com/)
- **Base Network**: Add Base to your wallet

### Token Requirements
- **$HAKU85 Tokens**: Minimum 10,000 tokens on Base network
- **Token Contract**: `0xf21ec85ce0b05640436ffd7e8fabba5d82eb0774`

## GitHub Repository Setup

### 1. Create New Repository

**Via GitHub Website:**
1. Go to [GitHub](https://github.com) and log in
2. Click the "+" icon in top right → "New repository"
3. Repository name: `haku-tower-defense`
4. Description: "Blockchain tower defense game with $HAKU85 staking"
5. Choose "Public" or "Private"
6. **Do NOT** initialize with README (we have one)
7. Click "Create repository"

### 2. Clone and Push Project

**In your terminal:**

```bash
# Navigate to your project directory
cd /path/to/haku-tower-defense

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: HAKU Tower Defense game"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/haku-tower-defense.git

# Push to GitHub
git branch -M main
git push -u origin main