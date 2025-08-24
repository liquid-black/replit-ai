import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProcessingRule } from "../../types";

interface RuleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<ProcessingRule, "id">) => void;
  rule?: ProcessingRule;
}

export function RuleConfigModal({ isOpen, onClose, onSave, rule }: RuleConfigModalProps) {
  const [name, setName] = useState(rule?.name || "");
  const [pattern, setPattern] = useState(rule?.pattern || "");
  const [outputTemplate, setOutputTemplate] = useState(rule?.outputTemplate || "");
  const [fieldsJson, setFieldsJson] = useState(
    rule?.fields ? JSON.stringify(rule.fields, null, 2) : `[
  {
    "name": "trip_date",
    "source": "html",
    "selector": ".trip-date",
    "process": "extract_text"
  },
  {
    "name": "amount",
    "source": "html",
    "selector": ".total-amount",
    "process": "extract_text"
  }
]`
  );

  const handleSave = () => {
    try {
      const fields = JSON.parse(fieldsJson);
      const ruleData: Omit<ProcessingRule, "id"> = {
        name,
        pattern,
        fields,
        outputTemplate,
        requiredFields: [],
        isActive: true,
      };
      onSave(ruleData);
      onClose();
    } catch (error) {
      alert("Invalid JSON format in fields configuration");
    }
  };

  const handleTest = () => {
    try {
      JSON.parse(fieldsJson);
      alert("JSON configuration is valid!");
    } catch (error) {
      alert("Invalid JSON format in fields configuration");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Processing Rule" : "Configure Extraction Rules"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6" data-testid="rule-config-form">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Rule Configuration</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Uber Receipts"
                  data-testid="input-rule-name"
                />
              </div>
              <div>
                <Label htmlFor="emailPattern">Email Pattern</Label>
                <Input
                  id="emailPattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g., Your Uber receipt"
                  data-testid="input-email-pattern"
                />
              </div>
              <div>
                <Label htmlFor="outputTemplate">Output Template</Label>
                <Input
                  id="outputTemplate"
                  value={outputTemplate}
                  onChange={(e) => setOutputTemplate(e.target.value)}
                  placeholder="e.g., uber_{date}_{amount}.pdf"
                  data-testid="input-output-template"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">JSON Configuration</h4>
            <Textarea
              value={fieldsJson}
              onChange={(e) => setFieldsJson(e.target.value)}
              placeholder="Paste or edit your JSON configuration here..."
              className="h-64 font-mono text-sm"
              data-testid="textarea-fields-json"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTest}
            data-testid="button-test-rule"
          >
            Test Rule
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600"
            data-testid="button-save-rule"
          >
            Save Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
