#!/bin/bash

set -e

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Error: Invalid version type. Use patch, minor, or major"
    exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
    echo "❌ Error: Working directory is not clean. Commit or stash changes first."
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "❌ Error: Must be on main branch to release. Currently on: $CURRENT_BRANCH"
    exit 1
fi

IS_PRIVATE=$(gh repo view --json isPrivate --jq '.isPrivate')
if [[ "$IS_PRIVATE" == "true" ]]; then
    echo "⚠️  Warning: Repository is private. Make it public? (y/N)"
    read -r MAKE_PUBLIC
    if [[ "$MAKE_PUBLIC" == "y" ]]; then
        echo "🔓 Making repository public..."
        gh repo edit --visibility public --accept-visibility-change-consequences
        echo "✅ Repository is now public"
    else
        echo "❌ Error: Cannot release to a private repository. Aborting."
        exit 1
    fi
else
    echo "✅ Repository is public"
fi

echo "🔄 Pulling latest changes..."
git pull origin main

if node -e "process.exit(require('./package.json').scripts?.test ? 0 : 1)" 2>/dev/null; then
    echo "🧪 Running tests..."
    npm test
else
    echo "⏭️  No test script found in package.json, skipping tests..."
fi

if node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)" 2>/dev/null; then
    echo "🔨 Building project..."
    npm run build
else
    echo "⏭️  No build script found in package.json, skipping build..."
fi

echo "📦 Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE -m "Release %s"

NEW_VERSION=$(node -p "require('./package.json').version")

echo "⬆️  Pushing to git..."
git push origin main --follow-tags

echo "🚀 Publishing to npm..."
npm publish --access public

echo "📝 Creating GitHub release..."
gh release create "v$NEW_VERSION" \
    --title "Release v$NEW_VERSION" \
    --generate-notes \
    --draft

echo ""
echo "════════════════════════════════════════════"
echo "✅ Release v$NEW_VERSION completed!"
echo "════════════════════════════════════════════"