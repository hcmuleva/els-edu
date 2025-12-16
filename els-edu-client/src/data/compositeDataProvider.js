import { strapiDataProvider } from '../api/dataProvider';
import { mockInvoiceProvider } from './mockInvoiceProvider';

// Resources that should use the mock provider (empty array means all use Strapi)
const MOCK_RESOURCES = [];

// Composite data provider that routes to appropriate provider based on resource
export const compositeDataProvider = {
  getList: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.getList(resource, params);
    }
    return strapiDataProvider.getList(resource, params);
  },
  
  getOne: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.getOne(resource, params);
    }
    return strapiDataProvider.getOne(resource, params);
  },
  
  getMany: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.getMany(resource, params);
    }
    return strapiDataProvider.getMany(resource, params);
  },
  
  getManyReference: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.getManyReference(resource, params);
    }
    return strapiDataProvider.getManyReference(resource, params);
  },
  
  create: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.create(resource, params);
    }
    return strapiDataProvider.create(resource, params);
  },
  
  update: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.update(resource, params);
    }
    return strapiDataProvider.update(resource, params);
  },
  
  updateMany: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.updateMany(resource, params);
    }
    return strapiDataProvider.updateMany(resource, params);
  },
  
  delete: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.delete(resource, params);
    }
    return strapiDataProvider.delete(resource, params);
  },
  
  deleteMany: (resource, params) => {
    if (MOCK_RESOURCES.includes(resource)) {
      return mockInvoiceProvider.deleteMany(resource, params);
    }
    return strapiDataProvider.deleteMany(resource, params);
  },
};