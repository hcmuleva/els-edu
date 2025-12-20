import React from 'react';
import { Chip } from '@mui/material';

const StatusChip = ({ status }) => {
  const getStatusProps = (status) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          color: 'default',
          className: 'text-gray-600 bg-gray-100'
        };
      case 'sent':
        return {
          label: 'Sent',
          color: 'info',
          className: 'text-blue-600 bg-blue-100'
        };
      case 'paid':
        return {
          label: 'Paid',
          color: 'success',
          className: 'text-green-600 bg-green-100'
        };
      case 'overdue':
        return {
          label: 'Overdue',
          color: 'error',
          className: 'text-red-600 bg-red-100'
        };
      default:
        return {
          label: status,
          color: 'default',
          className: 'text-gray-600 bg-gray-100'
        };
    }
  };

  const props = getStatusProps(status);

  return (
    <Chip
      label={props.label}
      color={props.color}
      size="small"
      className={props.className}
      variant="filled"
    />
  );
};

export default StatusChip;