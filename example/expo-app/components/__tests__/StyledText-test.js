import * as React from 'react';
import { render } from '@testing-library/react-native';

import { MonoText } from '../StyledText';

it(`renders correctly`, () => {
  const { toJSON } = render(<MonoText>Snapshot test!</MonoText>);

  expect(toJSON()).toMatchSnapshot();
});
