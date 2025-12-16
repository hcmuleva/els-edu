import React from 'react';
import {
  SelectInput,
  DateInput
} from 'react-admin';

export const invoiceFilters = [
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={[
      { id: 'draft', name: 'Draft' },
      { id: 'sent', name: 'Sent' },
      { id: 'paid', name: 'Paid' },
      { id: 'overdue', name: 'Overdue' },
    ]}
    alwaysOn={false}
  />,
  <SelectInput
    key="targetType"
    source="targetType"
    label="Target Type"
    choices={[
      { id: 'ORG', name: 'Organization' },
      { id: 'USER', name: 'User' },
    ]}
    alwaysOn={false}
  />,
  <SelectInput
    key="categoryType"
    source="categoryType"
    label="Category Type"
    choices={[
      { id: 'course', name: 'Course' },
      { id: 'subject', name: 'Subject' },
    ]}
    alwaysOn={false}
  />,
  <DateInput
    key="dateFrom"
    source="dateFrom"
    label="Date From"
  />,
  <DateInput
    key="dateTo"
    source="dateTo"
    label="Date To"
  />
];

// Legacy export for backward compatibility
const InvoiceFilters = () => null;
export default InvoiceFilters;