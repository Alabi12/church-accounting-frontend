import React from 'react';
import { Navigate } from 'react-router-dom';

const ExpenseApprovalsTreasurer = () => {
  return <Navigate to="/treasurer/expense-approvals" replace />;
};

export default ExpenseApprovalsTreasurer;