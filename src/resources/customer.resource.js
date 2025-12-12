import Resource from 'resources.js'

class CustomerSignUpResource extends Resource {
    toArray() {
        return {
            customerId: this.id,
            mobile: this.mobile,
            name: this.name,
        }
    }
}

class CustomerLoginResource extends Resource {
    toArray() {
        return {
            id: this.id,
            name: this.name,
            mobile: this.mobile,
        }
    }
}

class CustomerVerifyOtpResource extends Resource {
    toArray() {
        return {
            id: this.id,
            name: this.name,
            mobile: this.mobile,
            customerCode: this.customerCode,
        }
    }
}

class CustomerProfileResource extends Resource {
    toArray() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            mobile: this.mobile,
            profileUrl: this.profileUrl,
            customerCode: this.customerCode,
            status: this.status,
            isVerified: this.isVerified,
            defaultAddress:
                this.locations && this.locations[0]
                    ? new CustomerAddressResource(this.locations[0]).exec()
                    : null,
            stats: {
                totalOrders: this._count?.orders || 0,
                activeSubscriptions: this._count?.subscriptions || 0,
                savedAddresses: this._count?.locations || 0,
            },
        }
    }
}
class CustomerBasicInfoResource extends Resource {
    toArray() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            mobile: this.mobile,
            profileUrl: this.profileUrl,
            customerCode: this.customerCode,
            status: this.status,
            isVerified: this.isVerified,
        }
    }
}

class CustomerAddressResource extends Resource {
    toArray() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            roomNumber: this.roomNumber,
            buildingName: this.buildingName,
            zipCode: this.zipCode,
            mobile: this.mobile,
            latitude: this.latitude,
            longitude: this.longitude,
            isDefault: this.isDefault,
            country: this.country
                ? {
                      id: this.country.id,
                      name: this.country.name,
                      code: this.country.code,
                  }
                : null,
            location: this.location
                ? {
                      id: this.location.id,
                      name: this.location.name,
                      code: this.location.code,
                  }
                : null,
            area: this.area
                ? {
                      id: this.area.id,
                      name: this.area.name,
                  }
                : null,
        }
    }
}

class CustomerAddressListResource extends Resource {
    toArray() {
        const addresses = this.addresses || []

        return {
            addresses: addresses.map((address) =>
                new CustomerAddressResource(address).exec()
            ),
            total: addresses.length,
            defaultAddress:
                addresses.find((addr) => addr.isDefault)?.id || null,
        }
    }
}

export {
    CustomerSignUpResource,
    CustomerLoginResource,
    CustomerVerifyOtpResource,
    CustomerProfileResource,
    CustomerBasicInfoResource,
    CustomerAddressResource,
    CustomerAddressListResource,
}
