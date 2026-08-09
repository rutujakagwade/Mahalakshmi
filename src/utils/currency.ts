export function formatCurrency(value: number | string | undefined | null): string {
	const num = typeof value === 'number' ? value : parseFloat(String(value || '0')) || 0;
	try {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0,
		}).format(num);
	} catch (e) {
		return `₹${Math.round(num)}`;
	}
}

export default formatCurrency;
