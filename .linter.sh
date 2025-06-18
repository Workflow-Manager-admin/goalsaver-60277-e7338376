#!/bin/bash
cd /home/kavia/workspace/code-generation/goalsaver-60277-e7338376/goal_saver
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

