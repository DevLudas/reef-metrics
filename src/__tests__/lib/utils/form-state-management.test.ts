import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/components/hooks/useToast';
import type { Toast } from '@/components/ui/toast';

/**
 * State management utilities for form states and conditional rendering
 */

/**
 * Determine if form should be disabled based on multiple states
 */
export function shouldDisableForm(
	isSubmitting: boolean,
	isLoadingTypes: boolean,
	isValidating?: boolean
): boolean {
	return isSubmitting || isLoadingTypes || (isValidating ?? false);
}

/**
 * Get form status message based on loading states
 */
export function getFormStatusMessage(
	isLoadingTypes: boolean,
	selectedTypeId: string | undefined
): string | null {
	if (isLoadingTypes) {
		return 'Loading aquarium types...';
	}
	if (!selectedTypeId) {
		return 'Please select an aquarium type';
	}
	return null;
}

/**
 * Determine success message based on operation mode
 */
export function getSuccessMessage(isEditing: boolean, aquariumName: string): string {
	const action = isEditing ? 'updated' : 'created';
	return `${aquariumName} has been ${action} successfully.`;
}

/**
 * Determine form header text based on operation mode
 */
export function getFormHeaderText(isEditing: boolean): string {
	return isEditing ? 'Edit Aquarium' : 'Add New Aquarium';
}

/**
 * Determine form description based on operation mode
 */
export function getFormDescription(isEditing: boolean): string {
	return isEditing
		? 'Update the details of your aquarium.'
		: 'Create a new aquarium to start tracking water parameters.';
}

/**
 * Validate form field state
 */
export interface FieldState {
	value: string | number | undefined;
	touched: boolean;
	error?: string;
}

export function isFieldValid(field: FieldState): boolean {
	return field.touched && !field.error;
}

export function isFieldInvalid(field: FieldState): boolean {
	return field.touched && !!field.error;
}

// ============================================================================
// UNIT TESTS - MEDIUM PRIORITY (Custom Hooks, State Management, Conditional Rendering)
// ============================================================================

describe('MEDIUM PRIORITY - Should Test', () => {
	// ============================================================================
	// useToast Hook Tests
	// ============================================================================

	describe('useToast Hook', () => {
		it('should initialize with empty toast list', () => {
			// Act
			const { result } = renderHook(() => useToast());

			// Assert
			expect(result.current.toasts).toEqual([]);
		});

		it('should add toast to queue', () => {
			// Arrange
			const { result } = renderHook(() => useToast());
			const toastData = { title: 'Success', description: 'Operation completed' };

			// Act
			act(() => {
				result.current.addToast(toastData);
			});

			// Assert
			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0]).toMatchObject(toastData);
		});

		it('should add unique id to each toast', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			// Act
			act(() => {
				result.current.addToast({ title: 'Toast 1' });
				result.current.addToast({ title: 'Toast 2' });
			});

			// Assert
			expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
		});

		it('should remove toast by id', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			let toastId: string;

			act(() => {
				toastId = result.current.addToast({ title: 'To Remove' });
			});

			// Assert initial state
			expect(result.current.toasts).toHaveLength(1);

			// Act
			act(() => {
				result.current.removeToast(toastId!);
			});

			// Assert
			expect(result.current.toasts).toHaveLength(0);
		});

		it('should handle multiple toasts independently', () => {
			// Arrange
			const { result } = renderHook(() => useToast());
			let id1: string;
			let id2: string;
			let id3: string;

			// Act
			act(() => {
				id1 = result.current.addToast({ title: 'Toast 1' });
				id2 = result.current.addToast({ title: 'Toast 2' });
				id3 = result.current.addToast({ title: 'Toast 3' });
			});

			// Assert
			expect(result.current.toasts).toHaveLength(3);

			// Remove middle toast
			act(() => {
				result.current.removeToast(id2!);
			});

			// Assert
			expect(result.current.toasts).toHaveLength(2);
			expect(result.current.toasts[0].title).toBe('Toast 1');
			expect(result.current.toasts[1].title).toBe('Toast 3');
		});

		it('should support success convenience method', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			// Act
			act(() => {
				result.current.success('Aquarium created', 'Successfully created new aquarium');
			});

			// Assert
			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0].title).toBe('Aquarium created');
			expect(result.current.toasts[0].variant).toBe('success');
		});

		it('should support error convenience method', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			// Act
			act(() => {
				result.current.error('Error', 'Failed to create aquarium');
			});

			// Assert
			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0].title).toBe('Error');
			expect(result.current.toasts[0].variant).toBe('error');
		});

		it('should not remove non-existent toast', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			act(() => {
				result.current.addToast({ title: 'Toast 1' });
			});

			// Act - Try to remove non-existent toast
			act(() => {
				result.current.removeToast('non-existent-id');
			});

			// Assert - Should still have the original toast
			expect(result.current.toasts).toHaveLength(1);
		});

		it('should return toast id from addToast', () => {
			// Arrange
			const { result } = renderHook(() => useToast());

			// Act
			let toastId: string;
			act(() => {
				toastId = result.current.addToast({ title: 'Test' });
			});

			// Assert
			expect(toastId).toBeDefined();
			expect(typeof toastId).toBe('string');
			expect(result.current.toasts[0].id).toBe(toastId!);
		});
	});

	// ============================================================================
	// Form State Management - shouldDisableForm
	// ============================================================================

	describe('Form State Management - shouldDisableForm', () => {
		it('should disable form when submitting', () => {
			// Act & Assert
			expect(shouldDisableForm(true, false, false)).toBe(true);
		});

		it('should disable form when loading types', () => {
			// Act & Assert
			expect(shouldDisableForm(false, true, false)).toBe(true);
		});

		it('should disable form when validating', () => {
			// Act & Assert
			expect(shouldDisableForm(false, false, true)).toBe(true);
		});

		it('should enable form when all states are false', () => {
			// Act & Assert
			expect(shouldDisableForm(false, false, false)).toBe(false);
		});

		it('should disable form when multiple conditions are true', () => {
			// Act & Assert
			expect(shouldDisableForm(true, true, true)).toBe(true);
		});

		it('should disable form when submitting and loading', () => {
			// Act & Assert
			expect(shouldDisableForm(true, true, false)).toBe(true);
		});

		it('should handle undefined validating as false', () => {
			// Act & Assert
			expect(shouldDisableForm(false, false, undefined)).toBe(false);
		});

		it('should disable form when any condition is true', () => {
			// These test the logical OR behavior
			expect(shouldDisableForm(true, false, false)).toBe(true);
			expect(shouldDisableForm(false, true, false)).toBe(true);
			expect(shouldDisableForm(false, false, true)).toBe(true);
		});
	});

	// ============================================================================
	// Form Status Messages - getFormStatusMessage
	// ============================================================================

	describe('Form Status Messages - getFormStatusMessage', () => {
		it('should return loading message when types are loading', () => {
			// Act
			const message = getFormStatusMessage(true, 'selected-type');

			// Assert
			expect(message).toBe('Loading aquarium types...');
		});

		it('should return selection prompt when no type is selected', () => {
			// Act
			const message = getFormStatusMessage(false, undefined);

			// Assert
			expect(message).toBe('Please select an aquarium type');
		});

		it('should return selection prompt when type is empty string', () => {
			// Act
			const message = getFormStatusMessage(false, '');

			// Assert
			expect(message).toBe('Please select an aquarium type');
		});

		it('should return null when loading is complete and type is selected', () => {
			// Act
			const message = getFormStatusMessage(false, 'selected-type-id');

			// Assert
			expect(message).toBeNull();
		});

		it('should prioritize loading message over selection prompt', () => {
			// Act
			const message = getFormStatusMessage(true, undefined);

			// Assert
			expect(message).toBe('Loading aquarium types...');
		});

		it('should handle valid UUID as selected type', () => {
			// Act
			const message = getFormStatusMessage(false, '550e8400-e29b-41d4-a716-446655440000');

			// Assert
			expect(message).toBeNull();
		});
	});

	// ============================================================================
	// Success Message Generation - getSuccessMessage
	// ============================================================================

	describe('Success Message Generation - getSuccessMessage', () => {
		it('should generate creation message for new aquarium', () => {
			// Act
			const message = getSuccessMessage(false, 'My Reef Tank');

			// Assert
			expect(message).toBe('My Reef Tank has been created successfully.');
		});

		it('should generate update message for existing aquarium', () => {
			// Act
			const message = getSuccessMessage(true, 'My Reef Tank');

			// Assert
			expect(message).toBe('My Reef Tank has been updated successfully.');
		});

		it('should handle special characters in aquarium name', () => {
			// Act
			const message = getSuccessMessage(false, "John's 100L Reef 🪨");

			// Assert
			expect(message).toBe("John's 100L Reef 🪨 has been created successfully.");
		});

		it('should handle very long aquarium names', () => {
			// Act
			const longName = 'A'.repeat(50);
			const message = getSuccessMessage(true, longName);

			// Assert
			expect(message).toContain('has been updated successfully.');
			expect(message).toContain(longName);
		});
	});

	// ============================================================================
	// Form Header and Description - getFormHeaderText & getFormDescription
	// ============================================================================

	describe('Form Header and Description', () => {
		describe('getFormHeaderText', () => {
			it('should return "Edit Aquarium" when editing', () => {
				// Act
				const header = getFormHeaderText(true);

				// Assert
				expect(header).toBe('Edit Aquarium');
			});

			it('should return "Add New Aquarium" when creating', () => {
				// Act
				const header = getFormHeaderText(false);

				// Assert
				expect(header).toBe('Add New Aquarium');
			});
		});

		describe('getFormDescription', () => {
			it('should return edit description when editing', () => {
				// Act
				const description = getFormDescription(true);

				// Assert
				expect(description).toBe('Update the details of your aquarium.');
			});

			it('should return creation description when creating', () => {
				// Act
				const description = getFormDescription(false);

				// Assert
				expect(description).toBe(
					'Create a new aquarium to start tracking water parameters.'
				);
			});
		});

		it('should provide consistent descriptions for both modes', () => {
			// Act
			const editHeader = getFormHeaderText(true);
			const editDesc = getFormDescription(true);
			const createHeader = getFormHeaderText(false);
			const createDesc = getFormDescription(false);

			// Assert
			expect(editHeader).not.toBe(createHeader);
			expect(editDesc).not.toBe(createDesc);
		});
	});

	// ============================================================================
	// Field Validation State - isFieldValid & isFieldInvalid
	// ============================================================================

	describe('Field Validation State', () => {
		describe('isFieldValid', () => {
			it('should be valid when touched and no error', () => {
				// Arrange
				const field: FieldState = {
					value: 'Tank Name',
					touched: true,
					error: undefined,
				};

				// Act & Assert
				expect(isFieldValid(field)).toBe(true);
			});

			it('should be invalid when touched but has error', () => {
				// Arrange
				const field: FieldState = {
					value: 'ab',
					touched: true,
					error: 'Name must be at least 3 characters',
				};

				// Act & Assert
				expect(isFieldValid(field)).toBe(false);
			});

			it('should be invalid when not touched', () => {
				// Arrange
				const field: FieldState = {
					value: 'Tank Name',
					touched: false,
					error: undefined,
				};

				// Act & Assert
				expect(isFieldValid(field)).toBe(false);
			});

			it('should be invalid when not touched and has error', () => {
				// Arrange
				const field: FieldState = {
					value: '',
					touched: false,
					error: 'Field is required',
				};

				// Act & Assert
				expect(isFieldValid(field)).toBe(false);
			});
		});

		describe('isFieldInvalid', () => {
			it('should be invalid when touched with error', () => {
				// Arrange
				const field: FieldState = {
					value: 'ab',
					touched: true,
					error: 'Too short',
				};

				// Act & Assert
				expect(isFieldInvalid(field)).toBe(true);
			});

			it('should be valid when touched without error', () => {
				// Arrange
				const field: FieldState = {
					value: 'Valid Name',
					touched: true,
					error: undefined,
				};

				// Act & Assert
				expect(isFieldInvalid(field)).toBe(false);
			});

			it('should be valid when not touched (even with error)', () => {
				// Arrange
				const field: FieldState = {
					value: 'ab',
					touched: false,
					error: 'Too short',
				};

				// Act & Assert
				expect(isFieldInvalid(field)).toBe(false);
			});

			it('should be valid when not touched without error', () => {
				// Arrange
				const field: FieldState = {
					value: '',
					touched: false,
					error: undefined,
				};

				// Act & Assert
				expect(isFieldInvalid(field)).toBe(false);
			});
		});

		it('should handle number values in field state', () => {
			// Arrange
			const field: FieldState = {
				value: 100,
				touched: true,
				error: undefined,
			};

			// Act & Assert
			expect(isFieldValid(field)).toBe(true);
		});

		it('should handle undefined values in field state', () => {
			// Arrange
			const field: FieldState = {
				value: undefined,
				touched: true,
				error: 'Field is required',
			};

			// Act & Assert
			expect(isFieldInvalid(field)).toBe(true);
		});
	});

	// ============================================================================
	// Complex State Scenarios
	// ============================================================================

	describe('Complex State Scenarios', () => {
		it('should handle form submission workflow', () => {
			// Simulate form submission state transitions
			// 1. Initial state - form enabled
			expect(shouldDisableForm(false, false)).toBe(false);

			// 2. User submits - disable form during submission
			expect(shouldDisableForm(true, false)).toBe(true);

			// 3. After submission - enable form
			expect(shouldDisableForm(false, false)).toBe(false);
		});

		it('should handle type loading workflow', () => {
			// Simulate type loading state transitions
			// 1. Initial load - show loading message
			expect(getFormStatusMessage(true, undefined)).toBe('Loading aquarium types...');

			// 2. Types loaded but none selected
			expect(getFormStatusMessage(false, undefined)).toBe('Please select an aquarium type');

			// 3. Type selected - no message
			expect(getFormStatusMessage(false, 'type-1')).toBeNull();
		});

		it('should handle edit mode workflow', () => {
			// Simulate edit mode workflow
			const aquariumName = 'My Tank';

			// 1. Edit mode header and description
			expect(getFormHeaderText(true)).toBe('Edit Aquarium');
			expect(getFormDescription(true)).toContain('Update');

			// 2. Create mode header and description
			expect(getFormHeaderText(false)).toBe('Add New Aquarium');
			expect(getFormDescription(false)).toContain('Create');

			// 3. Success messages differ by mode
			expect(getSuccessMessage(true, aquariumName)).toContain('updated');
			expect(getSuccessMessage(false, aquariumName)).toContain('created');
		});

		it('should handle field validation workflow', () => {
			// Simulate field validation workflow
			const field: FieldState = {
				value: 'ab',
				touched: true,
				error: 'Name must be at least 3 characters',
			};

			// 1. Field is invalid
			expect(isFieldInvalid(field)).toBe(true);
			expect(isFieldValid(field)).toBe(false);

			// 2. User corrects field
			const correctedField: FieldState = {
				value: 'Valid Tank Name',
				touched: true,
				error: undefined,
			};

			expect(isFieldValid(correctedField)).toBe(true);
			expect(isFieldInvalid(correctedField)).toBe(false);
		});
	});

	// ============================================================================
	// Edge Cases - State Management
	// ============================================================================

	describe('Edge Cases - State Management', () => {
		it('should handle rapid form state changes', () => {
			// Simulate rapid user interactions
			expect(shouldDisableForm(false, false)).toBe(false);
			expect(shouldDisableForm(true, false)).toBe(true);
			expect(shouldDisableForm(false, true)).toBe(true);
			expect(shouldDisableForm(false, false)).toBe(false);
		});

		it('should handle empty aquarium name in success message', () => {
			// Act
			const message = getSuccessMessage(false, '');

			// Assert
			expect(message).toBe(' has been created successfully.');
		});

		it('should handle very long field error messages', () => {
			// Arrange
			const longError = 'E'.repeat(200);
			const field: FieldState = {
				value: 'ab',
				touched: true,
				error: longError,
			};

			// Act & Assert
			expect(isFieldInvalid(field)).toBe(true);
		});

		it('should maintain field state immutability', () => {
			// Arrange
			const original: FieldState = {
				value: 'Tank',
				touched: true,
				error: undefined,
			};

			const original2 = { ...original };

			// Act
			const isValid = isFieldValid(original);

			// Assert
			expect(original).toEqual(original2); // Object unchanged
			expect(isValid).toBe(true);
		});
	});
});

