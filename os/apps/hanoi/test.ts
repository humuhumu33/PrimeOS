import { createHanoi, HanoiInterface } from './index';
import { createModelTestAdapter } from '../../model';
import {
  TestableInterface,
  TestResult,
  TestResults,
  TestMetadata,
  TestResultStatus
} from '../../os-tests';

export default class HanoiTests implements TestableInterface {
  validateBase(): TestResult {
    const timestamp = Date.now();
    const instance: HanoiInterface = createHanoi();
    const hasMethods =
      typeof instance.solve === 'function' &&
      typeof instance.moveDisk === 'function';

    return {
      id: 'hanoi-base-validation',
      status: hasMethods ? TestResultStatus.Passed : TestResultStatus.Failed,
      error: hasMethods ? undefined : 'Required methods missing',
      duration: 0,
      timestamp,
      source: 'hanoi-tests'
    };
  }

  async runTests(): Promise<TestResults> {
    const hanoi = createHanoi({ disks: 3 });
    await hanoi.initialize();

    const adapter = createModelTestAdapter(hanoi, {
      tags: ['hanoi', 'puzzle'],
      testCases: [
        { name: 'auto-solve', input: { action: 'solve' } },
        { name: 'invalid-move', input: { action: 'move', from: 1, to: 0 } },
        { name: 'model-reset', input: null }
      ]
    });

    const results = await adapter.runTests();
    await hanoi.terminate();
    return results;
  }

  getTestMetadata(): TestMetadata {
    return {
      moduleName: 'hanoi',
      version: '0.1.0',
      testCount: 3,
      tags: ['hanoi', 'puzzle']
    };
  }
}
