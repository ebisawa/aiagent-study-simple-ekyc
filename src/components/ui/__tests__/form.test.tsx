import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from '../form';
import { Input } from '../input';

// テスト用のフォームコンポーネント
function TestForm() {
  const form = useForm({
    defaultValues: {
      username: '',
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ユーザー名</FormLabel>
              <FormControl>
                <Input placeholder="ユーザー名を入力" {...field} />
              </FormControl>
              <FormDescription>
                あなたのユーザー名を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe('Form', () => {
  it('フォームが正しくレンダリングされること', () => {
    render(<TestForm />);
    
    expect(screen.getByText('ユーザー名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ユーザー名を入力')).toBeInTheDocument();
    expect(screen.getByText('あなたのユーザー名を入力してください')).toBeInTheDocument();
  });
}); 