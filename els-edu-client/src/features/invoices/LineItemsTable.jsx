import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import { formatCurrency } from '../../utils/currency';

const LineItemsTable = ({ lineItems, currency = 'INR' }) => {
  const calculateLineTotal = (quantity, unitPrice) => {
    return quantity * unitPrice;
  };

  return (
    <TableContainer component={Paper} className="mt-4">
      <Table>
        <TableHead>
          <TableRow className="bg-gray-50">
            <TableCell>
              <Typography variant="subtitle2" className="font-semibold">
                Description
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" className="font-semibold">
                Quantity
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" className="font-semibold">
                Unit Price
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" className="font-semibold">
                Total
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems?.map((item, index) => {
            const lineTotal = calculateLineTotal(item.quantity, item.unitPrice);
            return (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell>
                  <Typography variant="body2">
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {item.quantity}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatCurrency(item.unitPrice, currency)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" className="font-medium">
                    {formatCurrency(lineTotal, currency)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LineItemsTable;