#!/bin/bash
# GitHub Release Script for notion-journal-skill

set -e

REPO_NAME="openclaw-notion-journal-skill"
GITHUB_USER="Charpup"
VERSION="v1.0.0"

echo "🚀 Preparing GitHub release for notion-journal-skill ${VERSION}..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git config user.email "galatea@openclaw.local"
    git config user.name "Galatea"
fi

# Add all files
echo "📁 Adding files to git..."
git add -A

# Commit
echo "💾 Creating initial commit..."
git commit -m "Initial release: notion-journal-skill v1.0.0

- Core journal management functionality
- Automatic content generation from memory files
- Backfill missing dates
- Duplicate detection
- Error handling and recovery
- Comprehensive test suite
- Full documentation" || echo "Nothing to commit"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

# Create tag
echo "🏷️  Creating tag ${VERSION}..."
git tag -a "${VERSION}" -m "Release ${VERSION}: Production-ready Notion Journal Skill" || echo "Tag already exists"

echo ""
echo "✅ Local repository prepared!"
echo ""
echo "Next steps:"
echo "1. Create GitHub repository: https://github.com/new"
echo "2. Repository name: ${REPO_NAME}"
echo "3. Push code:"
echo "   git push -u origin main"
echo "   git push origin ${VERSION}"
echo ""
echo "Or use GitHub CLI:"
echo "   gh repo create ${GITHUB_USER}/${REPO_NAME} --public --source=. --push"
