import React from 'react';
import { Navigate } from 'react-router-dom';

const ActiveBudgets = () => {
  return <Navigate to="/budgets?status=ACTIVE" replace />;
};

export default ActiveBudgets;