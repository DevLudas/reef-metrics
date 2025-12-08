import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers
 * Add any providers your app needs here (Providers, themes, etc.)
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
	const Wrapper = ({ children }: { children: React.ReactNode }) => {
		return <>{children}</>;
	};

	return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { customRender as render };

