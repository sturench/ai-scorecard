import { createMockHubSpotContact, createMockHubSpotDeal } from '../utils/test-helpers';

/**
 * Mock HubSpot API client for testing
 * This provides realistic mock responses for HubSpot operations
 */

export class MockHubSpotClient {
  private contacts = new Map<string, any>();
  private deals = new Map<string, any>();
  private nextContactId = 1000;
  private nextDealId = 2000;

  // Mock contact operations
  crm = {
    contacts: {
      basicApi: {
        create: jest.fn().mockImplementation(async (createRequest: any) => {
          const contactId = this.nextContactId++;
          const contact = createMockHubSpotContact({
            id: contactId.toString(),
            properties: {
              ...createRequest.properties,
              hs_createdate: new Date().toISOString(),
              hs_lastmodifieddate: new Date().toISOString(),
            },
          });

          this.contacts.set(contactId.toString(), contact);

          return {
            id: contactId.toString(),
            properties: contact.properties,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
          };
        }),

        update: jest.fn().mockImplementation(async (contactId: string, updateRequest: any) => {
          const existingContact = this.contacts.get(contactId);
          if (!existingContact) {
            throw new Error(`Contact ${contactId} not found`);
          }

          const updatedContact = {
            ...existingContact,
            properties: {
              ...existingContact.properties,
              ...updateRequest.properties,
              hs_lastmodifieddate: new Date().toISOString(),
            },
            updatedAt: new Date(),
          };

          this.contacts.set(contactId, updatedContact);
          return updatedContact;
        }),

        getById: jest.fn().mockImplementation(async (contactId: string) => {
          const contact = this.contacts.get(contactId);
          if (!contact) {
            throw new Error(`Contact ${contactId} not found`);
          }
          return contact;
        }),
      },
    },

    deals: {
      basicApi: {
        create: jest.fn().mockImplementation(async (createRequest: any) => {
          const dealId = this.nextDealId++;
          const deal = createMockHubSpotDeal({
            id: dealId.toString(),
            properties: {
              ...createRequest.properties,
              hs_createdate: new Date().toISOString(),
              hs_lastmodifieddate: new Date().toISOString(),
            },
            associations: createRequest.associations || {},
          });

          this.deals.set(dealId.toString(), deal);

          return {
            id: dealId.toString(),
            properties: deal.properties,
            associations: deal.associations,
            createdAt: deal.createdAt,
            updatedAt: deal.updatedAt,
          };
        }),

        update: jest.fn().mockImplementation(async (dealId: string, updateRequest: any) => {
          const existingDeal = this.deals.get(dealId);
          if (!existingDeal) {
            throw new Error(`Deal ${dealId} not found`);
          }

          const updatedDeal = {
            ...existingDeal,
            properties: {
              ...existingDeal.properties,
              ...updateRequest.properties,
              hs_lastmodifieddate: new Date().toISOString(),
            },
            updatedAt: new Date(),
          };

          this.deals.set(dealId, updatedDeal);
          return updatedDeal;
        }),

        getById: jest.fn().mockImplementation(async (dealId: string) => {
          const deal = this.deals.get(dealId);
          if (!deal) {
            throw new Error(`Deal ${dealId} not found`);
          }
          return deal;
        }),
      },
    },
  };

  // Helper methods for testing
  reset() {
    this.contacts.clear();
    this.deals.clear();
    this.nextContactId = 1000;
    this.nextDealId = 2000;

    // Reset all jest mocks
    this.crm.contacts.basicApi.create.mockClear();
    this.crm.contacts.basicApi.update.mockClear();
    this.crm.contacts.basicApi.getById.mockClear();
    this.crm.deals.basicApi.create.mockClear();
    this.crm.deals.basicApi.update.mockClear();
    this.crm.deals.basicApi.getById.mockClear();
  }

  getContacts() {
    return Array.from(this.contacts.values());
  }

  getDeals() {
    return Array.from(this.deals.values());
  }

  // Simulate API errors
  simulateError(operation: string, error: Error) {
    const operationMap = {
      createContact: this.crm.contacts.basicApi.create,
      updateContact: this.crm.contacts.basicApi.update,
      getContact: this.crm.contacts.basicApi.getById,
      createDeal: this.crm.deals.basicApi.create,
      updateDeal: this.crm.deals.basicApi.update,
      getDeal: this.crm.deals.basicApi.getById,
    };

    const mockFn = operationMap[operation as keyof typeof operationMap];
    if (mockFn) {
      mockFn.mockRejectedValueOnce(error);
    }
  }

  // Simulate rate limiting
  simulateRateLimit(operation: string, retryAfterSeconds = 10) {
    const error = new Error('Rate limit exceeded');
    (error as any).status = 429;
    (error as any).headers = { 'retry-after': retryAfterSeconds.toString() };
    this.simulateError(operation, error);
  }
}

// Export singleton instance for use in tests
export const mockHubSpotClient = new MockHubSpotClient();

// Reset function for use in test setup
export const resetHubSpotMocks = () => {
  mockHubSpotClient.reset();
};

// Pre-configured error scenarios
export const hubSpotErrorScenarios = {
  rateLimitError: (operation: string) => mockHubSpotClient.simulateRateLimit(operation),
  networkError: (operation: string) =>
    mockHubSpotClient.simulateError(operation, new Error('Network error')),
  authError: (operation: string) => {
    const error = new Error('Authentication failed');
    (error as any).status = 401;
    mockHubSpotClient.simulateError(operation, error);
  },
  serverError: (operation: string) => {
    const error = new Error('Internal server error');
    (error as any).status = 500;
    mockHubSpotClient.simulateError(operation, error);
  },
};
