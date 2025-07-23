import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  res.status(200).json({ message: 'Test avec withAuth', user: req.user });
};

export default withAuth(handler);