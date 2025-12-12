import Resource from 'resources.js'

export class CustomerResource extends Resource {
    toArray() {
        return {
            id: this.id,
            name: this.name,
            mobile: this.mobile,
            customerCode: this.customerCode,
            locations:
                this.locations?.map((loc) => ({
                    id: loc.id,
                    name: loc.name,
                    buildingName: loc.buildingName,
                    areaId: loc.areaId,
                    locationId: loc.locationId,
                })) ?? [],
        }
    }
}

export class SubscriptionResource extends Resource {
    toArray() {
        return {
            id: this.id,
            category: this.plan?.category?.name ?? null,
            plan: this.plan?.type ?? null,
            startDate: this.startDate,
            endDate: this.endDate,
            subscribedMealTypes:
                this.subscriptionMealTypes?.map((mt) => mt.mealType?.type) ??
                [],
        }
    }
}

export class AvailableDayResource extends Resource {
    toArray() {
        return {
            date: this.date,
            dayOfWeek: this.dayOfWeek,
            isAvailable: this.isAvailable,
            isHoliday: this.isHoliday,
            holidayName: this.holidayName ?? null,

            availableMealTypes: {
                breakfast: !!this.availableMealTypes?.breakfast,
                lunch: !!this.availableMealTypes?.lunch,
                dinner: !!this.availableMealTypes?.dinner,
            },

            foodItems: {
                breakfast: this.foodItems?.breakfast ?? [],
                lunch: this.foodItems?.lunch ?? [],
                dinner: this.foodItems?.dinner ?? [],
            },

            alreadyOrdered: this.alreadyOrdered ?? false,
            existingOrderNumber: this.existingOrderNumber ?? null,
            existingOrderStatus: this.existingOrderStatus ?? null,
        }
    }
}

// Main Combined Resources
export class OrderDaysResponseResource {
    constructor({ customer, subscription, orderingRules, availableDays }) {
        this.customer = customer
        this.subscription = subscription
        this.orderingRules = orderingRules
        this.availableDays = availableDays
    }

    exec() {
        return {
            customer: this.customer
                ? new CustomerResource(this.customer).exec()
                : null,
            subscription: this.subscription
                ? new SubscriptionResource(this.subscription).exec()
                : null,
            orderingRules: this.orderingRules,
            days: Array.isArray(this.availableDays)
                ? this.availableDays.map((d) =>
                      new AvailableDayResource(d).exec()
                  )
                : [],
        }
    }
}
