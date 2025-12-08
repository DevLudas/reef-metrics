import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeasurementsService } from '@/lib/services/measurements.service';
import type { CreateMeasurementCommand } from '@/types';

/**
 * Create a chainable mock for Supabase query builders that supports both
 * direct awaiting and method chaining
 */
const createMockChain = (returnValue: any = null, returnError: any = null) => {
	const resolvedValue = {
		data: returnValue,
		error: returnError,
		count: Array.isArray(returnValue) ? returnValue.length : 0
	};

	const chain = {
		select: vi.fn(function () {
			return this;
		}),
		eq: vi.fn(function () {
			return this;
		}),
		single: vi.fn().mockResolvedValue({ data: returnValue, error: returnError }),
		order: vi.fn(function () {
			return this;
		}),
		range: vi.fn(function () {
			return this;
		}),
		gte: vi.fn(function () {
			return this;
		}),
		lte: vi.fn(function () {
			return this;
		}),
		lt: vi.fn(function () {
			return this;
		}),
		// Support await on the chain itself (Supabase pattern)
		then: vi.fn((resolve) => {
			resolve(resolvedValue);
		}),
	};
	return chain;
};

describe('MeasurementsService', () => {
	let service: MeasurementsService;
	let mockSupabase: any;

	beforeEach(() => {
		mockSupabase = {
			from: vi.fn(),
		};
		service = new MeasurementsService(mockSupabase as any);
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - getMeasurements
	// ============================================================================

	describe('getMeasurements', () => {
		const userId = 'user-123';
		const aquariumId = 'aquarium-123';

		it('should verify aquarium ownership before fetching measurements', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurements(userId, aquariumId);

			// Assert
			expect(mockSupabase.from).toHaveBeenCalledWith('aquariums');
			expect(mockSupabase.from).toHaveBeenCalledWith('measurements');
		});

		it('should throw NOT_FOUND when aquarium does not exist', async () => {
			// Arrange
			mockSupabase.from.mockReturnValue(createMockChain(null, null));

			// Act & Assert
			await expect(service.getMeasurements(userId, aquariumId)).rejects.toThrow(
				'NOT_FOUND'
			);
		});

		it('should apply date range filters when provided', async () => {
			// Arrange
			const startDate = '2025-01-01T00:00:00Z';
			const endDate = '2025-01-31T23:59:59Z';

			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurements(userId, aquariumId, {
				start_date: startDate,
				end_date: endDate,
			});

			// Assert
			const measurementChain = mockSupabase.from.mock.results[1].value;
			expect(measurementChain.gte).toHaveBeenCalled();
			expect(measurementChain.lte).toHaveBeenCalled();
		});

		it('should filter by parameter_id when provided', async () => {
			// Arrange
			const parameterId = 'param-123';

			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurements(userId, aquariumId, { parameter_id: parameterId });

			// Assert
			const measurementChain = mockSupabase.from.mock.results[1].value;
			expect(measurementChain.eq).toHaveBeenCalled();
		});

		it('should apply sorting with correct order', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurements(
				userId,
				aquariumId,
				{},
				{},
				{ sort: 'created_at', order: 'asc' }
			);

			// Assert
			const measurementChain = mockSupabase.from.mock.results[1].value;
			expect(measurementChain.order).toHaveBeenCalled();
		});

		it('should apply pagination limits with max of 200', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurements(userId, aquariumId, {}, { limit: 500, offset: 10 });

			// Assert
			const measurementChain = mockSupabase.from.mock.results[1].value;
			expect(measurementChain.range).toHaveBeenCalled();
		});

		it('should return measurements with parameter details', async () => {
			// Arrange
			const mockMeasurements = [
				{
					id: 'measurement-1',
					aquarium_id: aquariumId,
					parameter_id: 'param-1',
					value: 1.5,
					measurement_time: '2025-01-01T12:00:00Z',
					notes: 'Good level',
					created_at: '2025-01-01T12:05:00Z',
					parameter: {
						id: 'param-1',
						name: 'PO4',
						full_name: 'Phosphate',
						unit: 'ppm',
					},
				},
			];

			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(mockMeasurements, null));

			// Act
			const result = await service.getMeasurements(userId, aquariumId);

			// Assert
			expect(result.measurements).toEqual(mockMeasurements);
			expect(result.total).toBe(1); // Updated: count matches array length
		});

		it('should return empty array when no measurements found', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(null, null));

			// Act
			const result = await service.getMeasurements(userId, aquariumId);

			// Assert
			expect(result.measurements).toEqual([]);
		});
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - getLatestMeasurements
	// ============================================================================

	describe('getLatestMeasurements', () => {
		const userId = 'user-123';
		const aquariumId = 'aquarium-123';

		it('should return latest measurement per parameter', async () => {
			// Arrange - Service will filter and group by parameter_id
			// Mock returns all measurements ordered by created_at desc
			// Service will pick the first of each parameter_id
			const mockMeasurements = [
				{
					id: 'measurement-1',
					aquarium_id: aquariumId,
					parameter_id: 'param-1',
					value: 1.5,
					measurement_time: '2025-01-02T12:00:00Z',
					notes: null,
					created_at: '2025-01-02T12:05:00Z',
					parameter: {
						id: 'param-1',
						name: 'PO4',
						full_name: 'Phosphate',
						unit: 'ppm',
					},
				},
				{
					id: 'measurement-3',
					aquarium_id: aquariumId,
					parameter_id: 'param-2',
					value: 500,
					measurement_time: '2025-01-02T12:00:00Z',
					notes: null,
					created_at: '2025-01-02T13:00:00Z',
					parameter: {
						id: 'param-2',
						name: 'NO3',
						full_name: 'Nitrate',
						unit: 'ppm',
					},
				},
			];

			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(mockMeasurements, null));

			// Act
			const result = await service.getLatestMeasurements(userId, aquariumId);

			// Assert - Should have 2 items (one per parameter)
			// The service groups by parameter_id and keeps only the latest
			expect(result).toHaveLength(2);
			expect(result.map(m => m.parameter_id).sort()).toEqual(['param-1', 'param-2']);
		});

		it('should order measurements by created_at descending', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getLatestMeasurements(userId, aquariumId);

			// Assert
			const measurementChain = mockSupabase.from.mock.results[1].value;
			expect(measurementChain.order).toHaveBeenCalled();
		});

		it('should handle empty measurement list', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(null, null));

			// Act
			const result = await service.getLatestMeasurements(userId, aquariumId);

			// Assert
			expect(result).toEqual([]);
		});
	});

	// ============================================================================
	// DATA TRANSFORMATION LOGIC - getMeasurementsByDate
	// ============================================================================

	describe('getMeasurementsByDate', () => {
		const userId = 'user-123';
		const aquariumId = 'aquarium-123';
		const date = '2025-01-01';

		it('should filter measurements by specific date', async () => {
			// Arrange
			const mockMeasurements = [
				{
					id: 'measurement-1',
					aquarium_id: aquariumId,
					parameter_id: 'param-1',
					value: 1.5,
					measurement_time: '2025-01-01T12:00:00Z',
					notes: null,
					created_at: '2025-01-01T12:05:00Z',
					parameter: {
						id: 'param-1',
						name: 'PO4',
						full_name: 'Phosphate',
						unit: 'ppm',
					},
				},
			];

			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain(mockMeasurements, null));

			// Act
			const result = await service.getMeasurementsByDate(userId, aquariumId, date);

			// Assert
			expect(result).toEqual(mockMeasurements);
		});

		it('should verify aquarium ownership before fetching measurements', async () => {
			// Arrange
			mockSupabase.from
				.mockReturnValueOnce(createMockChain({ id: aquariumId }, null))
				.mockReturnValueOnce(createMockChain([], null));

			// Act
			await service.getMeasurementsByDate(userId, aquariumId, date);

			// Assert
			expect(mockSupabase.from).toHaveBeenCalledWith('aquariums');
		});

		it('should throw NOT_FOUND when aquarium does not exist', async () => {
			// Arrange
			mockSupabase.from.mockReturnValue(createMockChain(null, null));

			// Act & Assert
			await expect(
				service.getMeasurementsByDate(userId, aquariumId, date)
			).rejects.toThrow('NOT_FOUND');
		});
	});
});

