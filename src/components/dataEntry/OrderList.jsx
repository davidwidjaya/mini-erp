
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const OrderList = ({ orders, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <FileText className="mr-2 h-5 w-5" />
        Draft Order List
      </h3>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No drafts yet</p>
        ) : (
          orders.map(order => (
            <motion.div
              key={order.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white rounded-lg border border-gray-200 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{order.no_invoice}</p>
                  <p className="text-xs text-gray-600">{order.client_name}</p>
                  <p className="text-xs text-gray-500">
                    {(order.line_items || []).length} item(s)
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onEdit(order.id, order)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500"
                    onClick={() => onDelete(order.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderList;
