#!/bin/bash

# Android SDK Release Script
# Usage: ./release.sh [version]
# Example: ./release.sh 1.0.0
# If no version provided, will use VERSION_NAME from gradle.properties

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from gradle.properties
GRADLE_VERSION=$(grep "VERSION_NAME=" gradle.properties | cut -d'=' -f2)

# Get version from argument, or use gradle.properties version
VERSION=${1:-$GRADLE_VERSION}

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version number not found in gradle.properties and not provided as argument${NC}"
    exit 1
fi

TAG="android-${VERSION}"

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Android SDK Release Script${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "Version from gradle.properties: ${YELLOW}${GRADLE_VERSION}${NC}"
echo -e "Release version: ${YELLOW}${VERSION}${NC}"
echo -e "Tag: ${YELLOW}${TAG}${NC}"
echo ""

# Warn if version differs from gradle.properties
if [ "$VERSION" != "$GRADLE_VERSION" ]; then
    echo -e "${YELLOW}Warning: Release version differs from gradle.properties${NC}"
    echo -e "${YELLOW}Consider updating VERSION_NAME in gradle.properties to ${VERSION}${NC}"
    echo ""
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag ${TAG} already exists${NC}"
    exit 1
fi

# Show git status
echo -e "${YELLOW}Current git status:${NC}"
git status --short

echo ""
echo -e "${YELLOW}==================================${NC}"
echo -e "${YELLOW}About to perform the following actions:${NC}"
echo -e "${YELLOW}==================================${NC}"
echo -e "1. Create tag: ${GREEN}${TAG}${NC}"
echo -e "2. Push to: ${GREEN}origin/master${NC}"
echo -e "3. Push tag: ${GREEN}${TAG}${NC}"
echo ""
echo -e "${RED}⚠️  This will create a Git tag and push to remote!${NC}"
echo ""
echo -e "${YELLOW}Are you sure you want to continue? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}Release cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Creating tag ${TAG}...${NC}"
git tag -a "$TAG" -m "Android SDK v${VERSION}"
echo -e "${GREEN}✓ Tag created${NC}"

echo ""
echo -e "${GREEN}Step 2: Pushing to origin/master...${NC}"
git push origin master
echo -e "${GREEN}✓ Pushed to master${NC}"

echo ""
echo -e "${GREEN}Step 3: Pushing tag ${TAG}...${NC}"
git push origin "$TAG"
echo -e "${GREEN}✓ Tag pushed${NC}"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✓ Release completed successfully!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "Tag: ${YELLOW}${TAG}${NC}"
echo -e "JitPack URL: ${YELLOW}https://jitpack.io/#moonrailgun/dreaction/${TAG}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Check JitPack build status"
echo "2. Update changelog if needed"
echo "3. Create GitHub release (optional)"
echo ""
