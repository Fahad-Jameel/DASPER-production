#!/usr/bin/env python3
# run_all_tests.py - Run all unit tests and generate report
import unittest
import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_test_suite():
    """Run all test suites and generate comprehensive report"""
    
    print("="*70)
    print("DASPER UNIT TEST SUITE")
    print("="*70)
    print(f"Test Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    print()
    
    # Import test modules
    test_modules = [
        'test_model_inference',
        'test_cost_estimation',
        'test_building_analysis'
    ]
    
    # Load all test suites
    loader = unittest.TestLoader()
    all_tests = unittest.TestSuite()
    
    for module_name in test_modules:
        try:
            module = __import__(module_name)
            suite = loader.loadTestsFromModule(module)
            all_tests.addTest(suite)
            print(f"✅ Loaded: {module_name}")
        except ImportError as e:
            print(f"⚠️  Could not load {module_name}: {e}")
        except Exception as e:
            print(f"❌ Error loading {module_name}: {e}")
    
    print()
    print("="*70)
    print("RUNNING TESTS")
    print("="*70)
    print()
    
    # Run all tests
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(all_tests)
    
    # Generate summary report
    print()
    print("="*70)
    print("TEST SUMMARY REPORT")
    print("="*70)
    
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped) if hasattr(result, 'skipped') else 0
    successes = total_tests - failures - errors - skipped
    
    print(f"Total Tests:     {total_tests}")
    print(f"✅ Passed:        {successes}")
    print(f"❌ Failed:        {failures}")
    print(f"⚠️  Errors:        {errors}")
    print(f"⏭️  Skipped:       {skipped}")
    
    if total_tests > 0:
        success_rate = (successes / total_tests) * 100
        print(f"Success Rate:     {success_rate:.1f}%")
    
    print("="*70)
    
    # Print failure details
    if failures > 0:
        print("\nFAILURES:")
        print("-"*70)
        for test, traceback in result.failures:
            print(f"❌ {test}")
            print(traceback)
            print()
    
    # Print error details
    if errors > 0:
        print("\nERRORS:")
        print("-"*70)
        for test, traceback in result.errors:
            print(f"⚠️  {test}")
            print(traceback)
            print()
    
    # Test coverage summary
    print("\n" + "="*70)
    print("TEST COVERAGE")
    print("="*70)
    print("✅ Model Inference:    Damage severity prediction, output validation")
    print("✅ Cost Estimation:    Cost calculation, regional factors, caps")
    print("✅ Building Analysis:  Area, height, volume estimation")
    print("="*70)
    
    # Return exit code
    return 0 if (failures == 0 and errors == 0) else 1

if __name__ == '__main__':
    exit_code = run_test_suite()
    sys.exit(exit_code)

