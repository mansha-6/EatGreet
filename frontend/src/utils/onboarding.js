export const hasExistingRestaurantSetup = (user) => {
  if (!user || user.role !== 'admin') return false;

  const details = user.restaurantDetails || {};
  const hasRestaurantName = !!user.restaurantName?.trim();
  const requiredInfo = [
    details.address,
    details.contactNumber,
    details.gstNumber,
    details.cuisineType,
    details.businessEmail,
  ];
  const filledInfoCount = requiredInfo.filter(value => !!value?.toString().trim()).length;

  // Stricter check: We need at least some basic info filled to skip onboarding
  // isActive: true is a default in the model, so we can't rely on it alone.
  return hasRestaurantName && filledInfoCount >= 3;
};

export const shouldRequireOnboarding = (user) => {
  if (!user || user.role !== 'admin') return false;
  return !user.isOnboarded && !hasExistingRestaurantSetup(user);
};
