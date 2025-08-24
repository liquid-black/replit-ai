import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { RuleConfigModal } from "@/components/modals/rule-config-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { ProcessingRule } from "../types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Rules() {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ProcessingRule | undefined>();
  const { toast } = useToast();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["/api/rules"],
  });

  const createRuleMutation = useMutation({
    mutationFn: api.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule Created",
        description: "Processing rule has been created successfully",
      });
      setIsRuleModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create processing rule",
        variant: "destructive",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string; updates: Partial<ProcessingRule> }) =>
      api.updateRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule Updated",
        description: "Processing rule has been updated successfully",
      });
      setIsRuleModalOpen(false);
      setEditingRule(undefined);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update processing rule",
        variant: "destructive",
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: api.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rule Deleted",
        description: "Processing rule has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete processing rule",
        variant: "destructive",
      });
    },
  });

  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsRuleModalOpen(true);
  };

  const handleEditRule = (rule: ProcessingRule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (ruleData: Omit<ProcessingRule, "id">) => {
    if (editingRule) {
      updateRuleMutation.mutate({
        ruleId: editingRule.id,
        updates: ruleData,
      });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const handleToggleRule = (rule: ProcessingRule) => {
    updateRuleMutation.mutate({
      ruleId: rule.id,
      updates: { isActive: !rule.isActive },
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header 
        title="Processing Rules"
        subtitle="Configure email processing rules to extract financial data"
        isConnected={true}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Processing Rules</h3>
              <p className="text-gray-600">Configure how to extract data from different types of email receipts</p>
            </div>
            <Button 
              onClick={handleAddRule}
              className="bg-primary-500 hover:bg-primary-600"
              data-testid="button-add-new-rule"
            >
              <i className="fas fa-plus mr-2"></i>
              Add New Rule
            </Button>
          </div>

          {/* Rules List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <i className="fas fa-cogs text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Processing Rules</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first processing rule to start extracting data from emails.
                  </p>
                  <Button 
                    onClick={handleAddRule}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create First Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {rules.map((rule: ProcessingRule) => (
                <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{rule.name}</h4>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Pattern:</span>
                            <p className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded mt-1">
                              {rule.pattern}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Output Template:</span>
                            <p className="text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded mt-1">
                              {rule.outputTemplate}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Fields:</span>
                            <p className="text-gray-600 mt-1">
                              {Array.isArray(rule.fields) ? rule.fields.length : 0} configured
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Required Fields:</span>
                            <p className="text-gray-600 mt-1">
                              {Array.isArray(rule.requiredFields) ? rule.requiredFields.length : 0} required
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRule(rule)}
                          data-testid={`button-toggle-${rule.id}`}
                        >
                          {rule.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          data-testid={`button-edit-${rule.id}`}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${rule.id}`}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Documentation */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rule Configuration Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Field Types</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code>header</code> - Extract from email headers</li>
                    <li>• <code>html</code> - Extract from HTML content using CSS selectors</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Processing Types</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code>extract_text</code> - Extract plain text content</li>
                    <li>• <code>extract_items</code> - Extract structured data lists</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <RuleConfigModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setEditingRule(undefined);
        }}
        onSave={handleSaveRule}
        rule={editingRule}
      />
    </div>
  );
}
