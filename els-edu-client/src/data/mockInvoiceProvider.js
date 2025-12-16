import invoicesData from './fixtures/invoices.json';
import orgsData from './fixtures/orgs.json';
import usersData from './fixtures/users.json';
import coursesData from './fixtures/courses.json';
import subjectsData from './fixtures/subjects.json';

// In-memory data store
let invoices = [...invoicesData];
let orgs = [...orgsData];
let users = [...usersData];
let courses = [...coursesData];
let subjects = [...subjectsData];

const getDataForResource = (resource) => {
  switch (resource) {
    case 'invoices': return invoices;
    case 'orgs': return orgs;
    case 'users': return users;
    case 'courses': return courses;
    case 'subjects': return subjects;
    default: return [];
  }
};

const setDataForResource = (resource, data) => {
  switch (resource) {
    case 'invoices': invoices = data; break;
    case 'orgs': orgs = data; break;
    case 'users': users = data; break;
    case 'courses': courses = data; break;
    case 'subjects': subjects = data; break;
  }
};

const applyFilters = (data, filters) => {
  let filtered = [...data];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    if (key === 'dateFrom') {
      filtered = filtered.filter(item => new Date(item.date) >= new Date(value));
    } else if (key === 'dateTo') {
      filtered = filtered.filter(item => new Date(item.date) <= new Date(value));
    } else {
      filtered = filtered.filter(item => {
        const itemValue = item[key];
        if (typeof itemValue === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        return itemValue === value;
      });
    }
  });
  
  return filtered;
};

const applySort = (data, sort) => {
  if (!sort || !sort.field) return data;
  
  return [...data].sort((a, b) => {
    const aVal = a[sort.field];
    const bVal = b[sort.field];
    
    if (aVal < bVal) return sort.order === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sort.order === 'ASC' ? 1 : -1;
    return 0;
  });
};

export const mockInvoiceProvider = {
  getList: (resource, params) => {
    const data = getDataForResource(resource);
    const { page = 1, perPage = 25 } = params.pagination || {};
    const { field, order } = params.sort || {};
    const filters = params.filter || {};
    
    // Apply filters
    let filtered = applyFilters(data, filters);
    
    // Apply sorting
    if (field && order) {
      filtered = applySort(filtered, { field, order });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    return Promise.resolve({
      data: paginatedData,
      total: filtered.length,
    });
  },
  
  getOne: (resource, params) => {
    const data = getDataForResource(resource);
    const item = data.find(item => item.id == params.id);
    
    if (!item) {
      return Promise.reject(new Error(`${resource} not found`));
    }
    
    return Promise.resolve({ data: item });
  },
  
  getMany: (resource, params) => {
    const data = getDataForResource(resource);
    const items = data.filter(item => params.ids.includes(item.id));
    
    return Promise.resolve({ data: items });
  },
  
  getManyReference: (resource, params) => {
    const data = getDataForResource(resource);
    const { page = 1, perPage = 25 } = params.pagination || {};
    const { field, order } = params.sort || {};
    const filters = { ...params.filter, [params.target]: params.id };
    
    // Apply filters
    let filtered = applyFilters(data, filters);
    
    // Apply sorting
    if (field && order) {
      filtered = applySort(filtered, { field, order });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    return Promise.resolve({
      data: paginatedData,
      total: filtered.length,
    });
  },
  
  create: (resource, params) => {
    const data = getDataForResource(resource);
    const newId = Math.max(...data.map(item => parseInt(item.id)), 0) + 1;
    const newItem = { ...params.data, id: newId };
    
    const updatedData = [...data, newItem];
    setDataForResource(resource, updatedData);
    
    return Promise.resolve({ data: newItem });
  },
  
  update: (resource, params) => {
    const data = getDataForResource(resource);
    const index = data.findIndex(item => item.id == params.id);
    
    if (index === -1) {
      return Promise.reject(new Error(`${resource} not found`));
    }
    
    const updatedItem = { ...data[index], ...params.data };
    const updatedData = [...data];
    updatedData[index] = updatedItem;
    setDataForResource(resource, updatedData);
    
    return Promise.resolve({ data: updatedItem });
  },
  
  updateMany: (resource, params) => {
    const data = getDataForResource(resource);
    const updatedData = data.map(item => 
      params.ids.includes(item.id) ? { ...item, ...params.data } : item
    );
    setDataForResource(resource, updatedData);
    
    return Promise.resolve({ data: params.ids });
  },
  
  delete: (resource, params) => {
    const data = getDataForResource(resource);
    const item = data.find(item => item.id == params.id);
    
    if (!item) {
      return Promise.reject(new Error(`${resource} not found`));
    }
    
    const updatedData = data.filter(item => item.id != params.id);
    setDataForResource(resource, updatedData);
    
    return Promise.resolve({ data: item });
  },
  
  deleteMany: (resource, params) => {
    const data = getDataForResource(resource);
    const updatedData = data.filter(item => !params.ids.includes(item.id));
    setDataForResource(resource, updatedData);
    
    return Promise.resolve({ data: params.ids });
  },
};