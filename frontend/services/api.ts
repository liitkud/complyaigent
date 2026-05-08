
export const api = {
	getStatus: async (): Promise<{ status: string }> => {
		await new Promise((resolve) => setTimeout(resolve, 300));
		return { status: 'ok' };
	},
};
