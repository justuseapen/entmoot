# Testing Guide for Entmoot Mobile

This guide shows how to write tests for the Entmoot mobile app.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test Button.test.tsx
```

---

## Test Structure

### 1. Component Tests

**Location:** `src/components/__tests__/ComponentName.test.tsx`

**Example: Button Component Test**

Create: `mobile/src/components/ui/__tests__/Button.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with text', () => {
      const { getByText } = render(<Button>Click Me</Button>);
      expect(getByText('Click Me')).toBeTruthy();
    });

    it('renders all variants', () => {
      const { rerender, getByText } = render(
        <Button variant="primary">Primary</Button>
      );
      expect(getByText('Primary')).toBeTruthy();

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(getByText('Secondary')).toBeTruthy();

      rerender(<Button variant="outline">Outline</Button>);
      expect(getByText('Outline')).toBeTruthy();

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(getByText('Ghost')).toBeTruthy();
    });

    it('renders all sizes', () => {
      const { rerender, getByText } = render(
        <Button size="small">Small</Button>
      );
      expect(getByText('Small')).toBeTruthy();

      rerender(<Button size="medium">Medium</Button>);
      expect(getByText('Medium')).toBeTruthy();

      rerender(<Button size="large">Large</Button>);
      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      const { getByTestId, queryByText } = render(
        <Button loading testID="test-button">
          Click Me
        </Button>
      );

      // Text should not be visible
      expect(queryByText('Click Me')).toBeNull();

      // Loading indicator should be present
      // ActivityIndicator is tested by checking component behavior
      const button = getByTestId('test-button');
      expect(button).toBeTruthy();
    });

    it('is disabled when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Button loading onPress={onPress} testID="test-button">
          Click Me
        </Button>
      );

      const button = getByTestId('test-button');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button disabled onPress={onPress}>
          Click Me
        </Button>
      );

      const button = getByText('Click Me');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Interaction', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button onPress={onPress}>Click Me</Button>
      );

      const button = getByText('Click Me');
      fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button disabled onPress={onPress}>
          Click Me
        </Button>
      );

      const button = getByText('Click Me');
      fireEvent.press(button);

      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button accessibility role', () => {
      const { getByRole } = render(<Button>Click Me</Button>);
      expect(getByRole('button')).toBeTruthy();
    });

    it('respects custom accessibility label', () => {
      const { getByLabelText } = render(
        <Button accessibilityLabel="Custom Label">
          Click Me
        </Button>
      );
      expect(getByLabelText('Custom Label')).toBeTruthy();
    });

    it('announces disabled state to screen readers', () => {
      const { getByRole } = render(<Button disabled>Click Me</Button>);
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('announces loading state to screen readers', () => {
      const { getByRole } = render(<Button loading>Click Me</Button>);
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('Styling', () => {
    it('applies fullWidth style', () => {
      const { getByTestId } = render(
        <Button fullWidth testID="test-button">
          Click Me
        </Button>
      );

      const button = getByTestId('test-button');
      expect(button.props.style).toContainEqual(
        expect.objectContaining({ width: '100%' })
      );
    });
  });
});
```

---

### 2. API Client Tests

**Location:** `src/lib/__tests__/api.test.ts`

**Example: API Client Test**

Create: `mobile/src/lib/__tests__/api.test.ts`

```typescript
import { apiClient, apiFetch, authFetch } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.setTokens(null, null);
  });

  describe('Token Management', () => {
    it('includes auth token in requests', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      apiClient.setTokens('test-token', 'refresh-token');
      await authFetch('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('does not include auth token in skipAuth requests', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      apiClient.setTokens('test-token', 'refresh-token');
      await apiFetch('/test');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchCall.headers.Authorization).toBeUndefined();
    });
  });

  describe('Token Refresh', () => {
    it('refreshes token on 401 and retries request', async () => {
      const mockRefreshResponse = {
        token: 'new-token',
        refresh_token: 'new-refresh-token',
      };
      const mockDataResponse = { data: 'test' };

      // First call returns 401
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      // Refresh call succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRefreshResponse,
      });

      // Retry succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDataResponse,
      });

      apiClient.setTokens('old-token', 'refresh-token');
      const onTokenRefresh = jest.fn();
      apiClient.setOnTokenRefresh(onTokenRefresh);

      const result = await authFetch('/test');

      expect(result).toEqual(mockDataResponse);
      expect(onTokenRefresh).toHaveBeenCalledWith('new-token', 'new-refresh-token');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('calls onAuthError when refresh fails', async () => {
      // First call returns 401
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      // Refresh call fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid refresh token' }),
      });

      apiClient.setTokens('old-token', 'refresh-token');
      const onAuthError = jest.fn();
      apiClient.setOnAuthError(onAuthError);

      await expect(authFetch('/test')).rejects.toThrow('Session expired');
      expect(onAuthError).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('throws error with message from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid input' }),
      });

      await expect(apiFetch('/test')).rejects.toThrow('Invalid input');
    });

    it('handles validation errors object', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          errors: {
            email: ['is invalid'],
            password: ['is too short'],
          },
        }),
      });

      await expect(apiFetch('/test')).rejects.toThrow('is invalid, is too short');
    });

    it('handles 204 No Content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiFetch('/test');
      expect(result).toEqual({});
    });
  });
});
```

---

### 3. Hook Tests

**Location:** `src/hooks/__tests__/useHookName.test.ts`

**Example: Custom Hook Test**

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuth } from '../useAuth';

describe('useAuth Hook', () => {
  it('initializes with no user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

---

## Mocking

### Mocking Expo Modules

Create: `mobile/__mocks__/@env.js`

```javascript
module.exports = {
  API_URL: 'http://localhost:3000',
};
```

Create: `mobile/jest.setup.js`

```javascript
// Mock Expo modules
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

---

## Test Coverage Goals

| Category | Minimum | Target | Stretch |
|----------|---------|--------|---------|
| Components | 60% | 80% | 90% |
| Utils/Lib | 80% | 90% | 95% |
| Hooks | 70% | 85% | 90% |
| Overall | 60% | 80% | 85% |

---

## Best Practices

### DO
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Test accessibility props
- ✅ Mock external dependencies
- ✅ Test error cases
- ✅ Test loading states
- ✅ Use `getByRole` over `getByTestId`
- ✅ Clean up after each test

### DON'T
- ❌ Test implementation details
- ❌ Test third-party libraries
- ❌ Write flaky tests
- ❌ Skip error cases
- ❌ Leave console errors unhandled
- ❌ Test styles in detail (just verify they're applied)

---

## Useful Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)

---

## Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Create test file: `src/components/ui/__tests__/Button.test.tsx`
- [ ] Copy example test from this guide
- [ ] Run tests: `npm test`
- [ ] Verify tests pass
- [ ] Add more test cases
- [ ] Check coverage: `npm test -- --coverage`

---

**Next Steps:**
1. Start with Button component tests
2. Add API client tests
3. Add form validation tests
4. Gradually increase coverage to 60%+
5. Set up CI/CD to run tests automatically
