import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MasterCataloguePage() {
  const [tab, setTab] = useState("products");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Master Catalogue</h1>
        <div className="flex gap-2">
          <Button>Export CSV</Button>
          <Button>Bulk Import</Button>
          <Button>Add New Item</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="add">Add New Item</TabsTrigger>
          <TabsTrigger value="import">Bulk Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-6">
              <Input placeholder="Search products..." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Input placeholder="Product Name" />
              <Input placeholder="SKU" />
              <Input placeholder="Brand" />
              <Button>Create Product</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardContent className="p-6">
              <input type="file" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardContent className="p-6">
              <Button>Download CSV</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
