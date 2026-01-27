#!/bin/bash
echo "Deploying backend to Vercel..."
cd "$(dirname "$0")"
vercel --prod
echo "Deployment complete!"