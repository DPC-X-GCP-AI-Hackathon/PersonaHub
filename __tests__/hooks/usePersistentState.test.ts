import { renderHook, act } from '@testing-library/react';
import usePersistentState from '../../hooks/usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with the initial state if localStorage is empty', () => {
    const { result } = renderHook(() => usePersistentState('testKey', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should initialize with the stored state if localStorage has a value', () => {
    window.localStorage.setItem('testKey', JSON.stringify('stored'));
    const { result } = renderHook(() => usePersistentState('testKey', 'initial'));
    expect(result.current[0]).toBe('stored');
  });

  it('should update the state and localStorage when the setter is called', () => {
    const { result } = renderHook(() => usePersistentState('testKey', 'initial'));

    act(() => {
      result.current[1]('new');
    });

    expect(result.current[0]).toBe('new');
    expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify('new'));
  });

  it('should handle complex objects', () => {
    const initialObject = { a: 1, b: 'test' };
    const newObject = { a: 2, b: 'new-test' };

    const { result } = renderHook(() => usePersistentState('objectKey', initialObject));
    expect(result.current[0]).toEqual(initialObject);

    act(() => {
      result.current[1](newObject);
    });

    expect(result.current[0]).toEqual(newObject);
    expect(window.localStorage.getItem('objectKey')).toBe(JSON.stringify(newObject));
  });
});
