#!/bin/bash

# Test coverage report script

echo "📊 Running Test Coverage Analysis..."
echo "==================================="
echo ""

# Run tests with coverage
echo "🧪 Running tests with coverage..."
npm run test:coverage

# Check if coverage directory exists
if [ -d "coverage" ]; then
    echo ""
    echo "📈 Coverage Summary:"
    echo "-------------------"
    
    # Extract coverage summary from lcov
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo "✅ Coverage report generated: coverage/lcov-report/index.html"
        
        # Try to extract summary if lcov is available
        if [ -f "coverage/lcov.info" ]; then
            echo ""
            echo "📊 Coverage Metrics:"
            # Simple line count analysis
            TOTAL_LINES=$(grep -c "^DA:" coverage/lcov.info || echo "0")
            COVERED_LINES=$(grep "^DA:" coverage/lcov.info | grep -c ",1$" || echo "0")
            
            if [ $TOTAL_LINES -gt 0 ]; then
                COVERAGE=$((COVERED_LINES * 100 / TOTAL_LINES))
                echo "   Lines Covered: $COVERED_LINES / $TOTAL_LINES ($COVERAGE%)"
            fi
        fi
    fi
    
    echo ""
    echo "📁 Coverage Files:"
    find coverage -name "*.html" -o -name "*.json" | head -10
    
else
    echo "❌ Coverage directory not found"
fi

echo ""
echo "💡 To view detailed coverage:"
echo "   open coverage/lcov-report/index.html"
echo ""

# Show test summary
echo "📋 Test Summary:"
echo "----------------"
npm test -- --listTests 2>/dev/null | grep -E "\.test\.(ts|js)$" | wc -l | xargs echo "Total test files:"

echo ""
echo "✅ Coverage analysis complete!"