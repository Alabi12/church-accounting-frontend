import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const PermissionMatrix = ({ roles, permissions, rolePermissions, onPermissionChange }) => {
  const [expandedSections, setExpandedSections] = useState({});

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSelectAll = (roleId, category, checked) => {
    const categoryPerms = groupedPermissions[category] || [];
    categoryPerms.forEach(perm => {
      onPermissionChange(roleId, perm.id, checked);
    });
  };

  const isCategoryAllSelected = (roleId, category) => {
    const categoryPerms = groupedPermissions[category] || [];
    if (categoryPerms.length === 0) return false;
    
    return categoryPerms.every(perm => 
      rolePermissions[roleId]?.[perm.id] === true
    );
  };

  const isCategorySomeSelected = (roleId, category) => {
    const categoryPerms = groupedPermissions[category] || [];
    const selectedCount = categoryPerms.filter(perm => 
      rolePermissions[roleId]?.[perm.id] === true
    ).length;
    
    return selectedCount > 0 && selectedCount < categoryPerms.length;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Permission
            </th>
            {roles.map(role => (
              <th key={role.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="capitalize">{role.name.replace('_', ' ')}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(groupedPermissions).map(([category, perms]) => (
            <React.Fragment key={category}>
              {/* Category Header */}
              <tr className="bg-gray-50">
                <td colSpan={roles.length + 1} className="px-4 py-2">
                  <button
                    onClick={() => toggleSection(category)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {expandedSections[category] ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                    <span>{category}</span>
                  </button>
                </td>
              </tr>

              {/* Category Permissions */}
              {expandedSections[category] && perms.map((permission) => (
                <motion.tr
                  key={permission.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <div className="font-medium">{permission.name}</div>
                    {permission.description && (
                      <div className="text-xs text-gray-500">{permission.description}</div>
                    )}
                  </td>
                  
                  {roles.map(role => (
                    <td key={role.id} className="px-4 py-2 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rolePermissions[role.id]?.[permission.id] || false}
                          onChange={(e) => onPermissionChange(role.id, permission.id, e.target.checked)}
                          className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                          disabled={role.name === 'super_admin'} // Super admin has all permissions
                        />
                      </label>
                    </td>
                  ))}
                </motion.tr>
              ))}

              {/* Category Select All Row */}
              {expandedSections[category] && (
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-700">
                    Select All for {category}
                  </td>
                  {roles.map(role => {
                    if (role.name === 'super_admin') {
                      return <td key={role.id} className="px-4 py-2 text-center">-</td>;
                    }
                    
                    const isAllSelected = isCategoryAllSelected(role.id, category);
                    const isSomeSelected = isCategorySomeSelected(role.id, category);
                    
                    return (
                      <td key={role.id} className="px-4 py-2 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={input => {
                              if (input) {
                                input.indeterminate = isSomeSelected && !isAllSelected;
                              }
                            }}
                            onChange={(e) => handleSelectAll(role.id, category, e.target.checked)}
                            className="h-4 w-4 text-[rgb(31,178,86)] focus:ring-[rgb(31,178,86)] border-gray-300 rounded"
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PermissionMatrix;