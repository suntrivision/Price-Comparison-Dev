
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onCategorySelect }: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm">Filter by Category</h3>
      <ScrollArea className="h-32">
        <div className="space-y-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            className="w-full justify-between"
            onClick={() => onCategorySelect('')}
          >
            <span>All Products</span>
            <Badge variant="secondary" className="ml-2">
              {categories.reduce((total, cat) => total + cat.count, 0)}
            </Badge>
          </Button>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-between"
              onClick={() => onCategorySelect(category.id)}
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
