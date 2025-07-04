#!/bin/bash
cd /home/kavia/workspace/code-generation/wilddraws-arena-106502-8a149bc2/frontend_web_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

